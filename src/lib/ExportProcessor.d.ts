import { AuthData, UrlHistory, HostRule, Variable, Project, ArcRequest } from '@advanced-rest-client/events';
import { DataExport } from '@advanced-rest-client/events';
/**
 * A class that processes ARC data to create a standard export object.
 */
export declare class ExportProcessor {
  /**
   * @param electronCookies True if the cookies were read from electron storage
   */
  constructor(electronCookies: boolean);

  /**
   * Creates an export object for the data.
   *
   * @param exportData
   * @param options Export configuration object
   * @return ARC export object declaration.
   */
  createExportObject(data: DataExport.ArcExportProcessedData[], options: DataExport.ExportOptionsInternal): DataExport.ArcExportObject;
  prepareItem(key: keyof DataExport.ArcNativeDataExport, values: any[]): any[];
  /**
   * Maps list of request to the export object.
   * @param requests The list of requests to process.
   */
  prepareRequestsList(requests: ArcRequest.ARCSavedRequest[]): DataExport.ExportArcSavedRequest[];
  prepareProjectsList(projects: Project.ARCProject[]): DataExport.ExportArcProjects[];
  prepareHistoryDataList(history: ArcRequest.ARCHistoryRequest[]): DataExport.ExportArcHistoryRequest[];
  prepareWsUrlHistoryData(data: UrlHistory.ARCWebsocketUrlHistory[]): DataExport.ExportArcWebsocketUrl[];
  prepareUrlHistoryData(data: UrlHistory.ARCUrlHistory[]): DataExport.ExportArcUrlHistory[];
  prepareVariablesData(data: Variable.ARCVariable[]): DataExport.ExportArcVariable[];
  prepareAuthData(authData: AuthData.ARCAuthData[]): DataExport.ExportArcAuthData[];
  prepareCookieData(cookies: any[]): any[];
  prepareHostRulesData(hostRules: HostRule.ARCHostRule[]): DataExport.ExportArcHostRule[];
  prepareClientCertData(items: DataExport.ArcExportClientCertificateData[]): DataExport.ExportArcClientCertificateData[];
}
