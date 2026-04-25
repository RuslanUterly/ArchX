FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["ArchX.Server/ArchX.Server.csproj", "ArchX.Server/"]
RUN dotnet restore "ArchX.Server/ArchX.Server.csproj"

COPY . .
RUN dotnet publish "ArchX.Server/ArchX.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "ArchX.Server.dll"]
