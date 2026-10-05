import 'api_client.dart';
import 'api_endpoints.dart';

class ContractService {
  static final _client = ApiClient.instance;

  /// Get user contracts
  static Future<List<dynamic>> getContracts({
    String? status,
    int? page,
    int? limit,
  }) async {
    try {
      final response = await _client.get(
        ApiEndpoints.contracts,
        queryParameters: {
          if (status != null) 'status': status,
          if (page != null) 'page': page,
          if (limit != null) 'limit': limit,
        },
      );
      return response.data['contracts'] ?? response.data;
    } catch (e) {
      throw Exception('خطا در دریافت قراردادها: ${e.toString()}');
    }
  }

  /// Get contract by ID
  static Future<Map<String, dynamic>> getContract(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.contract(id));
      return response.data;
    } catch (e) {
      throw Exception('خطا در دریافت اطلاعات قرارداد: ${e.toString()}');
    }
  }

  /// Pay contract installment
  static Future<void> payInstallment(String contractId, int installmentNumber) async {
    try {
      await _client.post(
        '${ApiEndpoints.contract(contractId)}/pay',
        data: {'installment_number': installmentNumber},
      );
    } catch (e) {
      throw Exception('خطا در پرداخت قسط: ${e.toString()}');
    }
  }
}
