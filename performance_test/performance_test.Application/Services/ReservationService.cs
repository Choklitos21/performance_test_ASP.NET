using Microsoft.EntityFrameworkCore;
using performance_test.Application.DTOs.Reservation;
using performance_test.Infrastructure.Persistence;
using performance_test.Domain.Entities;
using performance_test.Domain.Enums;

namespace performance_test.Application.Services;

public class ReservationService
{
    private readonly AppDbContext _context;
    private readonly NotificationService _notificationService;

    public ReservationService(AppDbContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<ReservationDto> CreateAsync(string guestId, CreateReservationDto dto)
    {
        var checkIn = DateTime.SpecifyKind(
            dto.CheckInDate.ToDateTime(new TimeOnly(14, 0)), DateTimeKind.Utc);
        var checkOut = DateTime.SpecifyKind(
            dto.CheckOutDate.ToDateTime(new TimeOnly(12, 0)), DateTimeKind.Utc);

        if (checkIn >= checkOut)
            throw new InvalidOperationException("Check-out date must be after check-in date.");

        var guest = await _context.Users.FirstOrDefaultAsync(u => u.Id == guestId);
        if (guest == null || guest.KycStatus != KycStatus.Approved)
            throw new UnauthorizedAccessException("KYC verification required to create reservations.");

        var property = await _context.Properties.FindAsync(dto.PropertyId)
            ?? throw new InvalidOperationException("Property not found.");

        var hasOverlap = await _context.Reservations.AnyAsync(r =>
            r.PropertyId == dto.PropertyId &&
            r.Status == ReservationStatus.Confirmed &&
            r.CheckIn < checkOut && r.CheckOut > checkIn);

        if (hasOverlap)
            throw new InvalidOperationException("Property is not available for the selected dates.");

        var nights = Math.Max(1, dto.CheckOutDate.DayNumber - dto.CheckInDate.DayNumber);

        var reservation = new Reservation
        {
            PropertyId = dto.PropertyId,
            GuestId = guestId,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = property.PricePerNight * nights,
            Status = ReservationStatus.Confirmed
        };

        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            guestId,
            "Reservation Confirmed",
            $"Your reservation for '{property.Title}' is confirmed. Check-in: {checkIn:dd/MM/yyyy} at 14:00, Check-out: {checkOut:dd/MM/yyyy} at 12:00.");

        await _notificationService.CreateAsync(
            property.OwnerId,
            "New Reservation",
            $"A new reservation has been made for '{property.Title}'.");

        return MapToDto(reservation, property.Title);
    }

    public async Task<List<ReservationDto>> GetByGuestAsync(string guestId)
    {
        var reservations = await _context.Reservations
            .Include(r => r.Property)
            .Where(r => r.GuestId == guestId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reservations.Select(r => MapToDto(r, r.Property.Title)).ToList();
    }

    public async Task<List<ReservationDto>> GetByPropertyAsync(int propertyId, string ownerId)
    {
        var exists = await _context.Properties
            .AnyAsync(p => p.Id == propertyId && p.OwnerId == ownerId);

        if (!exists)
            throw new InvalidOperationException("Property not found.");

        var reservations = await _context.Reservations
            .Include(r => r.Property)
            .Where(r => r.PropertyId == propertyId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var guestIds = reservations.Select(r => r.GuestId).Distinct().ToList();
        var guests = await _context.Users
            .Where(u => guestIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u);

        return reservations.Select(r =>
        {
            guests.TryGetValue(r.GuestId, out var guest);
            return MapToDto(r, r.Property.Title, guest?.FullName, guest?.Email);
        }).ToList();
    }

    public async Task<bool> CancelAsync(int reservationId, string userId)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Property)
            .FirstOrDefaultAsync(r => r.Id == reservationId &&
                (r.GuestId == userId || r.Property.OwnerId == userId));

        if (reservation == null || reservation.Status != ReservationStatus.Confirmed)
            return false;

        reservation.Status = ReservationStatus.Cancelled;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            reservation.GuestId,
            "Reservation Cancelled",
            $"Your reservation for '{reservation.Property.Title}' has been cancelled.");

        return true;
    }

    private static ReservationDto MapToDto(Reservation r, string propertyTitle, string? guestName = null, string? guestEmail = null) => new()
    {
        Id = r.Id,
        PropertyId = r.PropertyId,
        PropertyTitle = propertyTitle,
        GuestId = r.GuestId,
        GuestName = guestName ?? "Guest",
        GuestEmail = guestEmail,
        CheckIn = r.CheckIn,
        CheckOut = r.CheckOut,
        TotalPrice = r.TotalPrice,
        Status = r.Status,
        CreatedAt = r.CreatedAt
    };
}
