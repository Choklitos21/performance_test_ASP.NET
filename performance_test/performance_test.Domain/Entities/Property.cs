namespace performance_test.Domain.Entities;

public class Property
{
    public int Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PropertyPhoto> Photos { get; set; } = new List<PropertyPhoto>();
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public ICollection<Wishlist> Wishlists { get; set; } = new List<Wishlist>();
}
