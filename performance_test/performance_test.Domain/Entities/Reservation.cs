using performance_test.Domain.Enums;

namespace performance_test.Domain.Entities;

public class Reservation
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public string GuestId { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public decimal TotalPrice { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Confirmed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Property Property { get; set; } = null!;
}
