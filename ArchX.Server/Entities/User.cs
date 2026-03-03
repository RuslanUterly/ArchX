using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace ArchX.Server.Entities;

public enum UserType
{
    Architect = 1,
    TeamLead,
    BackendDeveloper,
    FullstackDeveloper,
    DevOps,
    SystemsAnalyst,
    Student,
    Other
}

public class User : IdentityUser<long>
{
    [Key]
    public override long Id { get; set; }
    public UserType UserType { get; set; }
    public ICollection<Session> Sessions { get; set; }
}
