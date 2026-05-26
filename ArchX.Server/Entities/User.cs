using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ArchX.Server.Entities;

public class Roles
{
    public const string Admin = "Admin";
    public const string User = "User";
}

public enum UserType
{
    Architect = 1,
    TeamLead,
    BackendDeveloper,
    FullstackDeveloper,
    DevOps,
    SystemsAnalyst,
    Other = 8
}

public enum Grade
{
    Junior = 1,
    Middle = 2,
    Senior = 3,
    TeamLead = 4,
}

public class User : IdentityUser<long>
{
    [Key]
    public override long Id { get; set; }
    public UserType UserType { get; set; }
    public Grade Grade { get; set; }
    public ICollection<Session> Sessions { get; set; }
    public ICollection<FeedbackTicket> FeedbackTickets { get; set; } = new List<FeedbackTicket>();
}
