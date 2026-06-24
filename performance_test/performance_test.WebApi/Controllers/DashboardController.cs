using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Owner")]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var dashboard = await _dashboardService.GetDashboardAsync(ownerId, from, to);
        return Ok(dashboard);
    }
}
