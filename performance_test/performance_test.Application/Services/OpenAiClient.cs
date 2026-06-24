using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace performance_test.Application.Services;

/// <summary>
/// Sends an ID document image to the OpenAI Vision API and extracts basic identity fields.
/// Configure the key in appsettings.json: "OpenAI": { "ApiKey": "sk-..." }
/// Or via environment variable: OpenAI__ApiKey=sk-...
/// </summary>
public class OpenAiClient
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public OpenAiClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["OpenAI:ApiKey"] ?? string.Empty;
    }

    // Returns null when the image is not a readable ID document.
    // Throws InvalidOperationException when the API key is missing or the API call fails.
    public async Task<IdExtractionResult?> ExtractIdDataAsync(byte[] imageBytes, string mediaType)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new InvalidOperationException(
                "OpenAI API key is not configured. " +
                "Set 'OpenAI:ApiKey' in appsettings.json or the environment variable 'OpenAI__ApiKey'.");

        var base64 = Convert.ToBase64String(imageBytes);
        var dataUrl = $"data:{mediaType};base64,{base64}";

        var prompt =
            "You are an ID document reader. " +
            "Extract these fields from the document image: firstName, lastName, documentNumber, dateOfBirth. " +
            "Respond ONLY with a JSON object in this exact format: " +
            "{\"firstName\":\"...\",\"lastName\":\"...\",\"documentNumber\":\"...\",\"dateOfBirth\":\"YYYY-MM-DD\"}. " +
            "If this is not a valid ID document or the required fields are not readable, " +
            "respond with: {\"error\":\"Cannot extract data from document\"}.";

        var requestBody = new
        {
            model = "gpt-4o",
            max_tokens = 200,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "text",      text = prompt },
                        new { type = "image_url", image_url = new { url = dataUrl } }
                    }
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _http.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"OpenAI API returned {response.StatusCode}: {errorBody}");
        }

        var rawResponse = await response.Content.ReadAsStringAsync();

        // Pull the text out of choices[0].message.content
        using var apiDoc = JsonDocument.Parse(rawResponse);
        var content = apiDoc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;

        // Strip markdown code fences that GPT sometimes adds
        var cleaned = content.Trim();
        if (cleaned.StartsWith("```"))
        {
            var firstNewline = cleaned.IndexOf('\n');
            var lastFence   = cleaned.LastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline)
                cleaned = cleaned[(firstNewline + 1)..lastFence].Trim();
        }

        try
        {
            using var resultDoc = JsonDocument.Parse(cleaned);
            var root = resultDoc.RootElement;

            // GPT signals it couldn't read the document with an "error" field
            if (root.TryGetProperty("error", out _))
                return null;

            var dobString = root.GetProperty("dateOfBirth").GetString() ?? string.Empty;
            var dob = DateTime.TryParse(dobString, out var parsed)
                ? DateTime.SpecifyKind(parsed, DateTimeKind.Utc)
                : DateTime.UtcNow.AddYears(-25); // fallback — unlikely with a real ID

            return new IdExtractionResult
            {
                FirstName      = root.GetProperty("firstName").GetString()      ?? string.Empty,
                LastName       = root.GetProperty("lastName").GetString()       ?? string.Empty,
                DocumentNumber = root.GetProperty("documentNumber").GetString() ?? string.Empty,
                DateOfBirth    = dob
            };
        }
        catch
        {
            // Unparseable response — treat as rejection
            return null;
        }
    }
}

public class IdExtractionResult
{
    public string   FirstName      { get; set; } = string.Empty;
    public string   LastName       { get; set; } = string.Empty;
    public string   DocumentNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth    { get; set; }
}
