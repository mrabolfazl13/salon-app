import 'package:flutter/material.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  final List<Map<String, dynamic>> _transactions = [
    {'id': 1, 'type': 'income', 'amount': 500000.0, 'description': 'رزرو سانس', 'date': DateTime.now().subtract(const Duration(days: 1))},
    {'id': 2, 'type': 'expense', 'amount': 200000.0, 'description': 'هزینه برق', 'date': DateTime.now().subtract(const Duration(days: 2))},
    {'id': 3, 'type': 'income', 'amount': 450000.0, 'description': 'رزرو سانس', 'date': DateTime.now().subtract(const Duration(days: 3))},
  ];

  String _formatPrice(double price) {
    return '${price.toStringAsFixed(0)} ریال';
  }

  String _formatDate(DateTime date) {
    return '${date.year}/${date.month}/${date.day}';
  }

  double get _totalIncome {
    return _transactions
        .where((t) => t['type'] == 'income')
        .fold(0, (sum, t) => sum + t['amount']);
  }

  double get _totalExpense {
    return _transactions
        .where((t) => t['type'] == 'expense')
        .fold(0, (sum, t) => sum + t['amount']);
  }

  double get _netProfit => _totalIncome - _totalExpense;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مدیریت مالی'),
      ),
      body: Column(
        children: [
          // Summary cards
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
            child: Row(
              children: [
                Expanded(
                  child: _buildSummaryCard(
                    'درآمد',
                    _formatPrice(_totalIncome),
                    Colors.green,
                    Icons.trending_up,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    'هزینه',
                    _formatPrice(_totalExpense),
                    Colors.red,
                    Icons.trending_down,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    'سود خالص',
                    _formatPrice(_netProfit),
                    _netProfit >= 0 ? Colors.blue : Colors.orange,
                    Icons.account_balance_wallet,
                  ),
                ),
              ],
            ),
          ),

          // Transactions list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _transactions.length,
              itemBuilder: (context, index) {
                final tx = _transactions[index];
                final isIncome = tx['type'] == 'income';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: Icon(
                      isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                      color: isIncome ? Colors.green : Colors.red,
                    ),
                    title: Text(tx['description']),
                    subtitle: Text(_formatDate(tx['date'])),
                    trailing: Text(
                      '${isIncome ? '+' : '-'} ${_formatPrice(tx['amount'])}',
                      style: TextStyle(
                        color: isIncome ? Colors.green : Colors.red,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _showAddTransactionDialog();
        },
        icon: const Icon(Icons.add),
        label: const Text('ثبت تراکنش'),
      ),
    );
  }

  Widget _buildSummaryCard(String title, String amount, Color color, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              amount,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddTransactionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ثبت تراکنش جدید'),
        content: const Text('این قابلیت در نسخه بعدی اضافه می‌شود'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('باشه'),
          ),
        ],
      ),
    );
  }
}
