using Microsoft.EntityFrameworkCore;
using performance_test.Application.DTOs.Property;
using performance_test.Infrastructure.Persistence;
using performance_test.Domain.Entities;
using performance_test.Domain.Enums;

namespace performance_test.Application.Services;

public class PropertyService
{
    private readonly AppDbContext _context;

    public PropertyService(AppDbContext context) => _context = context;

    public async Task<List<PropertyDto>> GetAllAsync(string? location, DateOnly? checkIn, DateOnly? checkOut)
    {
        var query = _context.Properties
            .Include(p => p.Photos)
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(p => p.Location.ToLower().Contains(location.ToLower()));

        if (checkIn.HasValue && checkOut.HasValue)
        {
            var checkInDt = DateTime.SpecifyKind(checkIn.Value.ToDateTime(new TimeOnly(14, 0)), DateTimeKind.Utc);
            var checkOutDt = DateTime.SpecifyKind(checkOut.Value.ToDateTime(new TimeOnly(12, 0)), DateTimeKind.Utc);

            query = query.Where(p => !p.Reservations.Any(r =>
                r.Status == ReservationStatus.Confirmed &&
                r.CheckIn < checkOutDt && r.CheckOut > checkInDt));
        }

        var properties = await query.ToListAsync();
        return properties.Select(MapToDto).ToList();
    }

    public async Task<PropertyDto?> GetByIdAsync(int id)
    {
        var property = await _context.Properties
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(p => p.Id == id);

        return property == null ? null : MapToDto(property);
    }

    public async Task<List<PropertyDto>> GetByOwnerAsync(string ownerId)
    {
        var properties = await _context.Properties
            .Include(p => p.Photos)
            .Where(p => p.OwnerId == ownerId)
            .ToListAsync();

        return properties.Select(MapToDto).ToList();
    }

    public async Task<PropertyDto> CreateAsync(string ownerId, CreatePropertyDto dto)
    {
        var property = new Property
        {
            OwnerId = ownerId,
            Title = dto.Title,
            Description = dto.Description,
            Location = dto.Location,
            PricePerNight = dto.PricePerNight,
            IsActive = true
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();
        return MapToDto(property);
    }

    public async Task<PropertyDto?> UpdateAsync(int id, string ownerId, UpdatePropertyDto dto)
    {
        var property = await _context.Properties
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == ownerId);

        if (property == null) return null;

        if (dto.Title != null) property.Title = dto.Title;
        if (dto.Description != null) property.Description = dto.Description;
        if (dto.Location != null) property.Location = dto.Location;
        if (dto.PricePerNight.HasValue) property.PricePerNight = dto.PricePerNight.Value;
        if (dto.IsActive.HasValue) property.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();
        return MapToDto(property);
    }

    public async Task<bool> DeleteAsync(int id, string ownerId)
    {
        var property = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == ownerId);

        if (property == null) return false;

        property.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> UploadPhotoAsync(int propertyId, string ownerId, Stream fileStream, string fileName)
    {
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "properties");
        Directory.CreateDirectory(uploadPath);
        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var filePath = Path.Combine(uploadPath, uniqueName);
        await using var fs = File.Create(filePath);
        await fileStream.CopyToAsync(fs);
        var url = $"/uploads/properties/{uniqueName}";
        await AddPhotoAsync(propertyId, ownerId, url);
        return url;
    }

    private async Task AddPhotoAsync(int propertyId, string ownerId, string url)
    {
        var property = await _context.Properties
            .FirstOrDefaultAsync(p => p.Id == propertyId && p.OwnerId == ownerId)
            ?? throw new InvalidOperationException("Property not found.");

        var maxOrder = await _context.PropertyPhotos
            .Where(p => p.PropertyId == propertyId)
            .Select(p => (int?)p.Order)
            .MaxAsync() ?? 0;

        _context.PropertyPhotos.Add(new PropertyPhoto
        {
            PropertyId = propertyId,
            Url = url,
            Order = maxOrder + 1
        });

        await _context.SaveChangesAsync();
    }

    private static PropertyDto MapToDto(Property p) => new()
    {
        Id = p.Id,
        OwnerId = p.OwnerId,
        Title = p.Title,
        Description = p.Description,
        Location = p.Location,
        PricePerNight = p.PricePerNight,
        IsActive = p.IsActive,
        PhotoUrls = p.Photos.OrderBy(ph => ph.Order).Select(ph => ph.Url).ToList()
    };
}
