using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportsController(ReportService reportService) => _reportService = reportService;

    [HttpGet("excel")]
    public async Task<IActionResult> DownloadExcel(
        [FromQuery] int? propertyId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var bytes = await _reportService.GenerateOwnerReportAsync(ownerId, propertyId, from, to);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"reservations_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}
