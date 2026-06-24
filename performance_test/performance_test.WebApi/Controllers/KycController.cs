using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KycController : ControllerBase
{
    private readonly KycService _kycService;

    public KycController(KycService kycService) => _kycService = kycService;

    [HttpPost("submit")]
    public async Task<IActionResult> Submit(IFormFile document)
    {
        if (document == null || document.Length == 0)
            return BadRequest(new { error = "No document provided." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        using var stream = document.OpenReadStream();
        var result = await _kycService.SubmitDocumentAsync(userId, stream, document.FileName);
        return Ok(result);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var status = await _kycService.GetStatusAsync(userId);
        return status == null
            ? NotFound(new { message = "No KYC document submitted yet." })
            : Ok(status);
    }
}
