import 'package:dio/dio.dart';

/// Varzesh3 live scores + news. The web app consumed this through a Vite
/// dev proxy that injected Origin/Referer headers; here we call the public
/// API directly with the same headers. Failures degrade silently (empty
/// bundles) exactly like the original frontend.
class SportsService {
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    validateStatus: (s) => s != null && s < 500,
  ));

  static const _host = 'https://web-api.varzesh3.com';
  static final _headers = <String, String>{
    'Origin': _host,
    'Referer': '$_host/',
    'Acept': 'application/json',
  };

  Future<MatchesBundle> getAllMatches() async {
    try {
      final res = await _dio.get<List<dynamic>>(
        '$_host/v2.0/livescore/today',
        options: Options(headers: _headers),
      );
      final data = res.data;
      if (data == null) return const MatchesBundle();

      final live = <LiveMatch>[];
      final upcoming = <LiveMatch>[];
      final finished = <LiveMatch>[];

      for (final leagueRaw in data) {
        if (leagueRaw is! Map) continue;
        final leagueTitle = '${leagueRaw['title'] ?? ''}';
        final dates = leagueRaw['dates'];
        if (dates is! List) continue;
        for (final dateGroup in dates) {
          if (dateGroup is! Map) continue;
          final matches = dateGroup['matches'];
          if (matches is! List) continue;
          for (final match in matches) {
            if (match is! Map) continue;
            final host = match['host'] as Map? ?? const {};
            final guest = match['guest'] as Map? ?? const {};
            final goals = match['goals'] as Map?;
            final status = (match['status'] as num?)?.toInt() ?? 0;
            final isLive = (match['isLive'] ?? false) as bool;
            final m = LiveMatch(
              id: (match['id'] as num?)?.toInt() ?? 0,
              homeTeam: '${host['name'] ?? ''}',
              awayTeam: '${guest['name'] ?? ''}',
              homeScore: (goals?['host'] as num?)?.toInt() ?? 0,
              awayScore: (goals?['guest'] as num?)?.toInt() ?? 0,
              minute: int.tryParse('${match['liveTime'] ?? ''}') ?? 0,
              league: leagueTitle,
              status: (status == 3 || isLive)
                  ? 'live'
                  : (status == 7 ? 'finished' : 'upcoming'),
              homeIcon: '${host['logo'] ?? ''}',
              awayIcon: '${guest['logo'] ?? ''}',
              time: '${match['time'] ?? ''}',
            );
            switch (m.status) {
              case 'live':
                live.add(m);
              case 'finished':
                finished.add(m);
              default:
                upcoming.add(m);
            }
          }
        }
      }

      return MatchesBundle(
        live: live.take(8).toList(),
        upcoming: upcoming.take(8).toList(),
        finished: finished.take(8).toList(),
      );
    } catch (_) {
      return const MatchesBundle();
    }
  }

  Future<List<NewsItem>> getSportsNews() async {
    final results = await Future.wait([
      _fetchNews('$_host/v1.0/news/mcost-visited', 'خبر'),
      _fetchNews('$_host/v1.0/news/latest', 'آخرین اخبار'),
    ]);
    final seen = <int>{};
    final merged = <NewsItem>[];
    for (final item in [...results[0].take(6), ...results[1].take(6)]) {
      if (seen.add(item.id)) merged.add(item);
      if (merged.length >= 12) break;
    }
    return merged;
  }

  Future<List<NewsItem>> _fetchNews(String url, String category) async {
    try {
      final res = await _dio.get<List<dynamic>>(
        url,
        options: Options(headers: _headers),
      );
      final data = res.data;
      if (data == null) return const [];
      return data
          .whereType<Map>()
          .take(12)
          .map((item) => NewsItem(
                id: (item['id'] as num?)?.toInt() ?? 0,
                title: '${item['title'] ?? ''}',
                category: (item['isLive'] ?? false) as bool ? 'زنده' : category,
                isLive: (item['isLive'] ?? false) as bool,
                date: item['publishedOn']?.toString(),
                source: '${item['link'] ?? ''}',
              ))
          .toList();
    } catch (_) {
      return const [];
    }
  }
}

class MatchesBundle {
  const MatchesBundle({
    this.live = const [],
    this.upcoming = const [],
    this.finished = const [],
  });

  final List<LiveMatch> live;
  final List<LiveMatch> upcoming;
  final List<LiveMatch> finished;
}

class LiveMatch {
  const LiveMatch({
    required this.id,
    required this.homeTeam,
    required this.awayTeam,
    required this.homeScore,
    required this.awayScore,
    required this.minute,
    required this.league,
    required this.status,
    this.homeIcon,
    this.awayIcon,
    this.time,
  });

  final int id;
  final String homeTeam;
  final String awayTeam;
  final int homeScore;
  final int awayScore;
  final int minute;
  final String league;
  final String status; // live|upcoming|finished
  final String? homeIcon;
  final String? awayIcon;
  final String? time;
}

class NewsItem {
  const NewsItem({
    required this.id,
    required this.title,
    required this.category,
    required this.isLive,
    this.date,
    this.source,
  });

  final int id;
  final String title;
  final String category;
  final bool isLive;
  final String? date;
  final String? source;
}
