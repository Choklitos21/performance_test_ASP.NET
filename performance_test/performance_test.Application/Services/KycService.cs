using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using performance_test.Application.DTOs.Kyc;
using performance_test.Infrastructure.Persistence;
using performance_test.Domain.Entities;
using performance_test.Domain.Enums;

namespace performance_test.Application.Services;

public class KycService
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly OpenAiClient _openAi;

    public KycService(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        OpenAiClient openAi)
    {
        _context     = context;
        _userManager = userManager;
        _openAi      = openAi;
    }

    public async Task<KycStatusDto> SubmitDocumentAsync(string userId, Stream fileStream, string fileName)
    {
        // Load image into memory — processed in-process only, never written to disk
        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms);
        var imageBytes = ms.ToArray();

        // Ask OpenAI to extract identity fields (sent as base64 data URL, no disk file)
        var mediaType = GetMediaType(fileName);
        var extracted = await _openAi.ExtractIdDataAsync(imageBytes, mediaType);

        // Resolve account holder for name comparison
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("User not found.");

        KycStatus status;
        double? similarityScore = null;
        string? rejectionMessage = null;

        if (extracted == null)
        {
            status = KycStatus.Rejected;
            rejectionMessage = "Could not extract data from the document. Please upload a clear, valid identity document.";
        }
        else
        {
            var docFullName = $"{extracted.FirstName} {extracted.LastName}".Trim();
            similarityScore = NameSimilarity(user.FullName, docFullName);

            if (similarityScore >= 0.70)
            {
                status = KycStatus.Approved;
            }
            else
            {
                status = KycStatus.Rejected;
                rejectionMessage = "Document name does not sufficiently match the account holder.";
            }
        }

        // Upsert the KYC record — only extracted metadata is persisted, not the document image
        var kyc = await _context.KycDocuments.FirstOrDefaultAsync(k => k.UserId == userId);
        if (kyc == null)
        {
            kyc = new KycDocument { UserId = userId };
            _context.KycDocuments.Add(kyc);
        }

        kyc.Status                  = status;
        kyc.ExtractedName           = extracted?.FirstName;
        kyc.ExtractedSurname        = extracted?.LastName;
        kyc.ExtractedDocumentNumber = extracted?.DocumentNumber;
        kyc.ExtractedBirthDate      = extracted?.DateOfBirth;

        // Mirror the status on the user record so reservation checks work
        user.KycStatus = status;
        await _userManager.UpdateAsync(user);

        await _context.SaveChangesAsync();

        // imageBytes goes out of scope here — GC will clear it from memory
        return new KycStatusDto
        {
            Status                  = kyc.Status,
            ExtractedName           = kyc.ExtractedName,
            ExtractedSurname        = kyc.ExtractedSurname,
            ExtractedDocumentNumber = kyc.ExtractedDocumentNumber,
            ExtractedBirthDate      = kyc.ExtractedBirthDate,
            SimilarityScore         = similarityScore,
            Message                 = rejectionMessage
        };
    }

    public async Task<KycStatusDto?> GetStatusAsync(string userId)
    {
        var kyc = await _context.KycDocuments.FirstOrDefaultAsync(k => k.UserId == userId);
        if (kyc == null) return null;

        return new KycStatusDto
        {
            Status                  = kyc.Status,
            ExtractedName           = kyc.ExtractedName,
            ExtractedSurname        = kyc.ExtractedSurname,
            ExtractedDocumentNumber = kyc.ExtractedDocumentNumber,
            ExtractedBirthDate      = kyc.ExtractedBirthDate
        };
    }

    private static string GetMediaType(string fileName) =>
        Path.GetExtension(fileName).ToLower() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            ".gif"            => "image/gif",
            ".webp"           => "image/webp",
            _                 => "image/jpeg"
        };

    private static double NameSimilarity(string accountName, string documentName)
    {
        var a = accountName.ToLowerInvariant().Trim();
        var b = documentName.ToLowerInvariant().Trim();

        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return 0.0;

        var aSorted = string.Join(" ", a.Split(' ', StringSplitOptions.RemoveEmptyEntries).OrderBy(w => w));
        var bSorted = string.Join(" ", b.Split(' ', StringSplitOptions.RemoveEmptyEntries).OrderBy(w => w));

        return Math.Max(
            LevenshteinSimilarity(a, b),
            LevenshteinSimilarity(aSorted, bSorted));
    }

    private static double LevenshteinSimilarity(string a, string b)
    {
        int dist = LevenshteinDistance(a, b);
        return 1.0 - (double)dist / Math.Max(a.Length, b.Length);
    }

    private static int LevenshteinDistance(string a, string b)
    {
        int m = a.Length, n = b.Length;
        var dp = new int[m + 1, n + 1];
        for (int i = 0; i <= m; i++) dp[i, 0] = i;
        for (int j = 0; j <= n; j++) dp[0, j] = j;
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i, j] = a[i - 1] == b[j - 1]
                    ? dp[i - 1, j - 1]
                    : 1 + Math.Min(dp[i - 1, j - 1], Math.Min(dp[i - 1, j], dp[i, j - 1]));
        return dp[m, n];
    }
}
