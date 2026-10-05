import 'package:flutter/material.dart';

class VenueDetailScreen extends StatelessWidget {
  final String venueId;
  
  const VenueDetailScreen({
    super.key,
    required this.venueId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('جزئیات سالن')),
      body: Center(child: Text('جزئیات سالن: $venueId')),
    );
  }
}
