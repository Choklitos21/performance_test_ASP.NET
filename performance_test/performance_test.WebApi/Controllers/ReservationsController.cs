using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.DTOs.Reservation;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservationService;

    public ReservationsController(ReservationService reservationService) => _reservationService = reservationService;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
    {
        if (User.IsInRole("Owner"))
            return StatusCode(403, new { message = "Owners cannot create reservations. Please use a Guest account." });

        try
        {
            var guestId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var reservation = await _reservationService.CreateAsync(guestId, dto);
            return StatusCode(201, reservation);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyReservations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var reservations = await _reservationService.GetByGuestAsync(userId);
        return Ok(reservations);
    }

    [Authorize(Roles = "Owner")]
    [HttpGet("property/{propertyId:int}")]
    public async Task<IActionResult> GetByProperty(int propertyId)
    {
        try
        {
            var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var reservations = await _reservationService.GetByPropertyAsync(propertyId, ownerId);
            return Ok(reservations);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var success = await _reservationService.CancelAsync(id, userId);
        return success ? NoContent() : NotFound();
    }
}
