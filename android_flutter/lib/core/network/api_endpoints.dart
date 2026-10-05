/// API endpoints matching Tauri backend
abstract final class ApiEndpoints {
  // Auth
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const getMe = '/auth/me';
  static const forgotPassword = '/auth/forgot-password';
  static const verifyEmail = '/auth/verify';
  
  // Venues
  static const venues = '/venues';
  static String venue(String id) => '/venues/$id';
  static String venueSlots(String id) => '/venues/$id/slots';
  
  // Bookings
  static const bookings = '/bookings';
  static String booking(String id) => '/bookings/$id';
  
  // User
  static const profile = '/profile';
  static const favorites = '/favorites';
  
  // Competitions
  static const competitions = '/competitions';
  
  // Games
  static const games = '/games';
  static String game(String id) => '/games/$id';
  
  // Teams
  static const teams = '/teams';
  static String team(String id) => '/teams/$id';
  
  // Contracts
  static const contracts = '/contracts';
  static String contract(String id) => '/contracts/$id';
  
  // Deals
  static const deals = '/deals';
  
  // Quiz
  static const quiz = '/quiz';
  
  // Manager
  static const managerDashboard = '/manager/dashboard';
  static const managerPricing = '/manager/pricing';
  static const managerContracts = '/manager/contracts';
  static const managerTeams = '/manager/teams';
  static const managerCrm = '/manager/crm';
  static const managerCheckin = '/manager/checkin';
  static const managerFinance = '/manager/finance';
  
  // Finance
  static const finance = '/finance';
  
  // Admin
  static const admin = '/admin';
  static const adminUsers = '/admin/users';
  static const adminVenues = '/admin/venues';
}
