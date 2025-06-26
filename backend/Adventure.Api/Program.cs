using System.Text;
using Adventure.Api.Data;
using Adventure.Api.Hubs;
using Adventure.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// --- SERVICES ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Often needed for SignalR with auth
    });
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    // This tells the serializer to handle object cycles by replacing them
    // with a reference, preventing the infinite loop.
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IBadgeService, BadgeService>();
builder.Services.AddSwaggerGen(options =>
{
    // Your existing AddSecurityDefinition and AddSecurityRequirement are correct.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { /* ... */ });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { /* ... */ });
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
builder.Services.AddScoped<IFileService, SupabaseFileService>();

// Add SignalR services
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.UseSnakeCaseNamingConvention();
});

// --- Configure Authentication with SignalR Support ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // --- THIS IS THE CRITICAL ADDITION ---
        // This event handler helps SignalR find the JWT token in the query string,
        // as WebSockets cannot send standard Authorization headers.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
        // ------------------------------------------

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// --- APP & MIDDLEWARE ---
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowAngularApp");

// UseRouting must come before UseAuthorization
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Map the controllers and hubs
app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");// It's good practice to map hubs after auth middleware

app.Run();