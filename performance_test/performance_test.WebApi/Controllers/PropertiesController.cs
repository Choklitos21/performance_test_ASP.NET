using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using performance_test.Application.DTOs.Property;
using performance_test.Application.Services;

namespace performance_test.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly PropertyService _propertyService;

    public PropertiesController(PropertyService propertyService) => _propertyService = propertyService;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? location,
        [FromQuery] DateOnly? checkIn,
        [FromQuery] DateOnly? checkOut)
    {
        var properties = await _propertyService.GetAllAsync(location, checkIn, checkOut);
        return Ok(properties);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var property = await _propertyService.GetByIdAsync(id);
        return property == null ? NotFound() : Ok(property);
    }

    [Authorize(Roles = "Owner")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyProperties()
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var properties = await _propertyService.GetByOwnerAsync(ownerId);
        return Ok(properties);
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePropertyDto dto)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var property = await _propertyService.CreateAsync(ownerId, dto);
        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyDto dto)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var property = await _propertyService.UpdateAsync(id, ownerId, dto);
        return property == null ? NotFound() : Ok(property);
    }

    [Authorize(Roles = "Owner")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var success = await _propertyService.DeleteAsync(id, ownerId);
        return success ? NoContent() : NotFound();
    }

    [Authorize(Roles = "Owner")]
    [HttpPost("{id:int}/photos")]
    public async Task<IActionResult> AddPhoto(int id, IFormFile file)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        using var stream = file.OpenReadStream();
        var url = await _propertyService.UploadPhotoAsync(id, ownerId, stream, file.FileName);
        return Ok(new { url });
    }
}
