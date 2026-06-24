using Microsoft.EntityFrameworkCore;
using performance_test.Application.DTOs.Wishlist;
using performance_test.Infrastructure.Persistence;
using performance_test.Domain.Entities;

namespace performance_test.Application.Services;

public class WishlistService
{
    private readonly AppDbContext _context;

    public WishlistService(AppDbContext context) => _context = context;

    public async Task<List<WishlistItemDto>> GetByUserAsync(string userId)
    {
        return await _context.Wishlists
            .Include(w => w.Property)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WishlistItemDto
            {
                Id = w.Id,
                PropertyId = w.PropertyId,
                PropertyTitle = w.Property.Title,
                Location = w.Property.Location,
                PricePerNight = w.Property.PricePerNight,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<WishlistItemDto> AddAsync(string userId, int propertyId)
    {
        var property = await _context.Properties.FindAsync(propertyId)
            ?? throw new InvalidOperationException("Property not found.");

        var existing = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.PropertyId == propertyId);

        if (existing != null)
            return new WishlistItemDto
            {
                Id = existing.Id,
                PropertyId = existing.PropertyId,
                PropertyTitle = property.Title,
                Location = property.Location,
                PricePerNight = property.PricePerNight,
                CreatedAt = existing.CreatedAt
            };

        var wishlist = new Wishlist { UserId = userId, PropertyId = propertyId };
        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync();

        return new WishlistItemDto
        {
            Id = wishlist.Id,
            PropertyId = propertyId,
            PropertyTitle = property.Title,
            Location = property.Location,
            PricePerNight = property.PricePerNight,
            CreatedAt = wishlist.CreatedAt
        };
    }

    public async Task<bool> RemoveAsync(string userId, int propertyId)
    {
        var wishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId && w.PropertyId == propertyId);

        if (wishlist == null) return false;

        _context.Wishlists.Remove(wishlist);
        await _context.SaveChangesAsync();
        return true;
    }
}
