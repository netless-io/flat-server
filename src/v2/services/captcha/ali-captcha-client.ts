// This file is auto-generated, don't edit it
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import Captcha20230305, * as $captcha20230305 from '@alicloud/captcha20230305';
import * as $Util from '@alicloud/tea-util';
import { PhoneSMS } from '../../../constants/Config';
import { FError } from "../../../error/ControllerError";
import { ErrorCode } from '../../../ErrorCode';
// import Credential from '@alicloud/credentials';

export class CaptchaClient {
  /**
   * @remarks
   * 使用凭据初始化账号 Client
   * @returns Client
   * 
   * @throws Exception
   */
  static createClient(): Captcha20230305 {
    // 工程代码建议使用更安全的无 AK 方式，凭据配置方式请参见：https://help.aliyun.com/document_detail/378664.html。
    // 直接传递配置对象以避免类型不兼容问题
    return new Captcha20230305({
        // 您的 AccessKey ID
        accessKeyId: PhoneSMS.captcha.accessId,
        // 您的 AccessKey Secret
        accessKeySecret: PhoneSMS.captcha.accessSecret,
        // 您的 Endpoint
        endpoint: PhoneSMS.captcha.endpoint,
    } as any);
  }

  static async main(captchaVerifyParam: string): Promise<boolean> {
    let client = CaptchaClient.createClient();
    let verifyIntelligentCaptchaRequest = new $captcha20230305.VerifyIntelligentCaptchaRequest({
      captchaVerifyParam,
      sceneId: PhoneSMS.captcha.sceneId,
    });
    try {
      const response = await client.verifyIntelligentCaptchaWithOptions(verifyIntelligentCaptchaRequest, new $Util.RuntimeOptions({ }));
      if (response.body?.code === "200") {
        return response.body?.result?.verifyResult || false;
      } else {
        throw new FError(ErrorCode.CaptchaFailed);
      }
    } catch (error) {
      throw new FError(ErrorCode.CaptchaFailed);
    }    
  }
}