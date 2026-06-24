namespace performance_test.Application.DTOs.Property;

public class PropertyDto
{
    public int Id { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public bool IsActive { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
}
