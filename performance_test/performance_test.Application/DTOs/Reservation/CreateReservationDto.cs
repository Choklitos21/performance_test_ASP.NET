namespace performance_test.Application.DTOs.Reservation;

public class CreateReservationDto
{
    public int PropertyId { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
}
