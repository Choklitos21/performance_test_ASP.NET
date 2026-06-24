using performance_test.Domain.Enums;

namespace performance_test.Application.DTOs.Reservation;

public class ReservationDto
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;
    public string GuestId { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string? GuestEmail { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public decimal TotalPrice { get; set; }
    public ReservationStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
