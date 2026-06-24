namespace performance_test.Application.DTOs.Wishlist;

public class WishlistItemDto
{
    public int Id { get; set; }
    public int PropertyId { get; set; }
    public string PropertyTitle { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public DateTime CreatedAt { get; set; }
}
