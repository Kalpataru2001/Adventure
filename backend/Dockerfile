# Stage 1: Build
# Use the official .NET 8 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy the solution file and project files first to leverage Docker layer caching
COPY Adventure.sln .
COPY Adventure.Api/Adventure.Api.csproj ./Adventure.Api/

# Restore dependencies for the entire solution
RUN dotnet restore "Adventure.sln"

# Copy the rest of the source code
COPY . .

# Publish the specific project, not the whole solution
WORKDIR /source/Adventure.Api
RUN dotnet publish "Adventure.Api.csproj" -c Release -o /app --no-restore

# Stage 2: Runtime
# Create the final, smaller image that will run the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "Adventure.Api.dll"]