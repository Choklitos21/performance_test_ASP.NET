namespace performance_test.Application.DTOs.Property;

public class UpdatePropertyDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public decimal? PricePerNight { get; set; }
    public bool? IsActive { get; set; }
}
