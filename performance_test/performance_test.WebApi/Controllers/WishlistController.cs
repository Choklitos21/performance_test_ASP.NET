using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WishlistController : ControllerBase
{
    private readonly WishlistService _wishlistService;

    public WishlistController(WishlistService wishlistService) => _wishlistService = wishlistService;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var items = await _wishlistService.GetByUserAsync(userId);
        return Ok(items);
    }

    [HttpPost("{propertyId:int}")]
    public async Task<IActionResult> Add(int propertyId)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var item = await _wishlistService.AddAsync(userId, propertyId);
            return Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{propertyId:int}")]
    public async Task<IActionResult> Remove(int propertyId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var success = await _wishlistService.RemoveAsync(userId, propertyId);
        return success ? NoContent() : NotFound();
    }
}
