import got from 'got';
import { LoggerUtil } from './LoggerUtil.js';
export class VersionUtil {
    static logger = LoggerUtil.getLogger('VersionUtil');
    static PROMOTION_TYPE = [
        'recommended',
        'latest'
    ];
    static isVersionAcceptable(version, acceptable) {
        if (version.getMajor() === 1) {
            return acceptable.find((element) => version.getMinor() === element) != null;
        }
        return false;
    }
    static versionGte(version, min) {
        if (version === min) {
            return true;
        }
        const left = version.split('.').map(x => Number(x));
        const right = min.split('.').map(x => Number(x));
        if (left.length != right.length) {
            throw new Error('Cannot compare mismatched versions.');
        }
        for (let i = 0; i < left.length; i++) {
            if (left[i] > right[i]) {
                return true;
            }
        }
        return false;
    }
    static isPromotionVersion(version) {
        return VersionUtil.PROMOTION_TYPE.includes(version.toLowerCase());
    }
    // -------------------------------
    // Forge
    static isOneDotTwelveFG2(libraryVersion) {
        const maxFG2 = [14, 23, 5, 2847];
        const verSplit = libraryVersion.split('.').map(v => Number(v));
        for (let i = 0; i < maxFG2.length; i++) {
            if (verSplit[i] > maxFG2[i]) {
                return false;
            }
        }
        return true;
    }
    static async getPromotionIndex() {
        const response = await got.get({
            method: 'get',
            url: 'https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions_slim.json',
            responseType: 'json'
        });
        return response.body;
    }
    static async getNeoForgeVersionIndex() {
        const response = await got.get({
            method: 'get',
            url: 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge',
            responseType: 'json'
        });
        return response.body;
    }
    static getPromotedVersionStrict(index, minecraftVersion, promotion) {
        const workingPromotion = promotion.toLowerCase();
        return index.promos[`${minecraftVersion}-${workingPromotion}`];
    }
    static async getPromotedForgeVersion(minecraftVersion, promotion) {
        const workingPromotion = promotion.toLowerCase();
        const res = await VersionUtil.getPromotionIndex();
        let version = res.promos[`${minecraftVersion}-${workingPromotion}`];
        if (version == null) {
            VersionUtil.logger.warn(`No ${workingPromotion} version found for Forge ${minecraftVersion}.`);
            VersionUtil.logger.warn('Attempting to pull latest version instead.');
            version = res.promos[`${minecraftVersion}-latest`];
            if (version == null) {
                throw new Error(`No latest version found for Forge ${minecraftVersion}.`);
            }
        }
        return version;
    }
    // -------------------------------
    // NeoForge
    static async getPromotedNeoForgeVersion(minecraftVersion, promotion) {
        const stable = promotion.toLowerCase() === 'recommended';
        const workingVersion = minecraftVersion.getMinor() + '.' + (minecraftVersion.getRevision() ? minecraftVersion.getRevision() : 0);
        const index = await VersionUtil.getNeoForgeVersionIndex();
        let version = VersionUtil.findNeoForgePromotedVersion(index, stable, workingVersion);
        if (version == null) {
            VersionUtil.logger.warn(`No ${promotion.toLowerCase()} version found for NeoForge ${minecraftVersion}.`);
            VersionUtil.logger.warn('Attempting to pull latest version instead.');
            version = VersionUtil.findNeoForgePromotedVersion(index, false, workingVersion);
            if (version == null) {
                throw new Error(`No latest version found for Forge ${minecraftVersion}.`);
            }
        }
        return version;
    }
    static findNeoForgePromotedVersion(index, stable, workingVersion) {
        // Expects to receive the incoming version index, with the latest version further in the array.
        let latestAvailable;
        index.versions.filter(version => version.startsWith(workingVersion)).forEach(version => {
            if (stable) {
                if (!version.endsWith('-beta'))
                    latestAvailable = version;
                return;
            }
            latestAvailable = version;
        });
        return latestAvailable;
    }
    // -------------------------------
    // Fabric
    static async getFabricInstallerMeta() {
        const response = await got.get({
            method: 'get',
            url: 'https://meta.fabricmc.net/v2/versions/installer',
            responseType: 'json'
        });
        return response.body;
    }
    static async getFabricLoaderMeta() {
        const response = await got.get({
            method: 'get',
            url: 'https://meta.fabricmc.net/v2/versions/loader',
            responseType: 'json'
        });
        return response.body;
    }
    static async getFabricGameMeta() {
        const response = await got.get({
            method: 'get',
            url: 'https://meta.fabricmc.net/v2/versions/game',
            responseType: 'json'
        });
        return response.body;
    }
    static async getFabricProfileJson(gameVersion, loaderVersion) {
        const response = await got.get({
            method: 'get',
            url: `https://meta.fabricmc.net/v2/versions/loader/${gameVersion}/${loaderVersion}/profile/json`,
            responseType: 'json'
        });
        return response.body;
    }
    static async getPromotedFabricVersion(promotion) {
        const stable = promotion.toLowerCase() === 'recommended';
        const fabricLoaderMeta = await this.getFabricLoaderMeta();
        return !stable ? fabricLoaderMeta[0].version : fabricLoaderMeta.find(({ stable }) => stable).version;
    }
}
//# sourceMappingURL=VersionUtil.js.map