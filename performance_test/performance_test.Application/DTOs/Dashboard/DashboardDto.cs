namespace performance_test.Application.DTOs.Dashboard;

public class DashboardDto
{
    public int TotalProperties { get; set; }
    public int TotalReservations { get; set; }
    public decimal TotalRevenue { get; set; }
    public double OccupancyRate { get; set; }
    public List<PropertyMetricsDto> PropertyMetrics { get; set; } = new();
}

public class PropertyMetricsDto
{
    public int PropertyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ReservationCount { get; set; }
    public decimal Revenue { get; set; }
    public double OccupancyRate { get; set; }
}
