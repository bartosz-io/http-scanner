import { D1ReportRepository } from '../repositories/D1ReportRepository';
import { FetchHttpService } from '../services/FetchHttpService';
import { HeaderAnalyzerService } from '../services/HeaderAnalyzerService';
import { ScoreNormalizerService } from '../services/ScoreNormalizerService';
import { ImageService } from '../services/R2ImageService';
import { FileConfigurationService } from '../services/FileConfigurationService';
import { ScanController } from '../controllers/ScanController';
import { ReportController } from '../controllers/ReportController';
import { ScanUrlUseCase } from '../../usecases/ScanUrlUseCase';
import { FetchReportUseCase } from '../../usecases/FetchReportUseCase';
import { ReportRepository } from '../../interfaces/repositories/ReportRepository';

/**
 * Factory class for creating application dependencies
 * This centralizes dependency creation and wiring, making it easier to manage
 * and maintain the application's dependency graph.
 */
export class DependencyFactory {
  /**
   * Create a repository for reports
   * @param db The D1 database instance
   * @returns A repository implementation
   */
  static createReportRepository(db: D1Database): ReportRepository {
    return new D1ReportRepository(db);
  }

  /**
   * Create all dependencies needed for the scan endpoint
   * @param env The environment bindings
   * @returns A configured ScanController
   */
  static createScanController(env: {
    DB: D1Database;
    IMAGES: R2Bucket;
    CDN_DOMAIN: string;
  }): ScanController {
    // Create repositories and services
    const reportRepository = this.createReportRepository(env.DB);
    const httpService = new FetchHttpService();
    const scoreNormalizer = new ScoreNormalizerService();
    const configService = new FileConfigurationService();
    const headerAnalyzerService = new HeaderAnalyzerService(scoreNormalizer, configService);
    const imageService = new ImageService(env.IMAGES);

    // Create use case
    const scanUrlUseCase = new ScanUrlUseCase(
      headerAnalyzerService,
      httpService,
      imageService,
      reportRepository
    );

    // Create and return controller
    return new ScanController(scanUrlUseCase, env.CDN_DOMAIN);
  }

  /**
   * Create all dependencies needed for the fetch report endpoint
   * @param env The environment bindings
   * @returns A configured ReportController
   */
  static createReportController(env: {
    DB: D1Database;
    CDN_DOMAIN: string;
  }): ReportController {
    // Create repository
    const reportRepository = this.createReportRepository(env.DB);

    // Create use case
    const fetchReportUseCase = new FetchReportUseCase(reportRepository);

    // Create and return controller
    return new ReportController(fetchReportUseCase, env.CDN_DOMAIN);
  }
}
