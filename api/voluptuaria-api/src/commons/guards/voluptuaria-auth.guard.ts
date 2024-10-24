import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { EncryptService } from "../../modules/app-security/services/encrypt.service"
import { ConfigService } from "@nestjs/config"
import { AppRequest } from "../../modules/app-security/data-contracts/app-request.datas"

/**
 * @brief Api token verification
 */
@Injectable()
export class VoluptuariaAuthGuard implements CanActivate {
    constructor(
        private readonly encryptService: EncryptService,
        protected readonly configService: ConfigService,
    ) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const voluptariaToken = request.headers["voluptaria-token"]
        const iv = request.headers["iv"]

        if (voluptariaToken == null || voluptariaToken == "") {
            throw new UnauthorizedException()
        }

        const requestApiToken = await this.getHashedApiToken({
            appRequest: {
                apiToken: voluptariaToken,
                iv: iv,
            },
        })
        const apiSecret = this.configService.getOrThrow("API_SECRET")
        console.log("VOILA", requestApiToken)
        if (requestApiToken != apiSecret) {
            throw new UnauthorizedException()
        }

        return true
    }

    /**
     * @brief Gets the hashed API token from the environment variables.
     * @returns {string} The hashed API token.
     */
    public async getHashedApiToken(Options: {
        appRequest: AppRequest
    }): Promise<string> {
        try {
            return await this.encryptService.decrypt({
                secretKey: this.configService.getOrThrow("API_TOKEN_SECRET"),
                iv: Options.appRequest.iv,
                toDecrypt: Options.appRequest.apiToken,
            })
        } catch (error) {
            return null
        }
    }
}
