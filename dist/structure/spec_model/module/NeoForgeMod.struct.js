import { ForgeModStructure113 } from './forgemod/ForgeMod113.struct.js';
import toml from 'toml';
import { BaseForgeModStructure } from './ForgeMod.struct.js';
import { capitalize } from '../../../util/StringUtils.js';
export class NeoForgeModStructure extends BaseForgeModStructure {
    constructor(absoluteRoot, relativeRoot, baseUrl, minecraftVersion, untrackedFiles) {
        super(absoluteRoot, relativeRoot, baseUrl, minecraftVersion, untrackedFiles);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isForVersion(version, libraryVersion) {
        return true;
    }
    getLoggerName() {
        return 'NeoForgeModStructure';
    }
    async getModuleId(name, path) {
        const fmData = await this.getModMetadata(name, path);
        return this.generateMavenIdentifier(this.getClaritasGroup(path), fmData.mods[0].modId, fmData.mods[0].version);
    }
    async getModuleName(name, path) {
        return capitalize((await this.getModMetadata(name, path)).mods[0].displayName);
    }
    processZip(zip, name, path) {
        let raw;
        try {
            raw = zip.entryDataSync('META-INF/neoforge.mods.toml');
        }
        catch (err) {
            // ignored
        }
        if (raw) {
            try {
                const parsed = toml.parse(raw.toString());
                this.modMetadata[name] = parsed;
            }
            catch (err) {
                this.logger.error(`NeoForgeNeoMod ${name} contains an invalid neoforge.mods.toml file.`);
            }
        }
        else {
            this.logger.error(`NeoForgeMod ${name} does not contain neoforge.mods.toml file.`);
        }
        const cRes = this.claritasResult?.[path];
        if (cRes == null) {
            this.logger.error(`Claritas failed to yield metadata for NeoForgeMod ${name}!`);
            this.logger.error('Is this mod malformatted or does Claritas need an update?');
        }
        const claritasId = cRes?.id;
        const crudeInference = this.attemptCrudeInference(name);
        if (this.modMetadata[name] != null) {
            const x = this.modMetadata[name];
            for (const entry of x.mods) {
                if (entry.modId === this.EXAMPLE_MOD_ID) {
                    entry.modId = this.discernResult(claritasId, crudeInference.name.toLowerCase());
                    entry.displayName = crudeInference.name;
                }
                if (entry.version === '${file.jarVersion}') {
                    let version = crudeInference.version;
                    try {
                        const manifest = zip.entryDataSync('META-INF/MANIFEST.MF');
                        const keys = manifest.toString().split('\n');
                        // this.logger.debug(keys)
                        for (const key of keys) {
                            const match = ForgeModStructure113.IMPLEMENTATION_VERSION_REGEX.exec(key);
                            if (match != null) {
                                version = match[1];
                            }
                        }
                        this.logger.debug(`NeoForgeMod ${name} contains a version wildcard, inferring ${version}`);
                    }
                    catch {
                        this.logger.debug(`NeoForgeMod ${name} contains a version wildcard yet no MANIFEST.MF.. Defaulting to ${version}`);
                    }
                    entry.version = version;
                }
            }
        }
        else {
            this.modMetadata[name] = ({
                modLoader: 'javafml',
                loaderVersion: '',
                mods: [{
                        modId: this.discernResult(claritasId, crudeInference.name.toLowerCase()),
                        version: crudeInference.version,
                        displayName: crudeInference.name,
                        description: ''
                    }]
            });
        }
        return this.modMetadata[name];
    }
}
//# sourceMappingURL=NeoForgeMod.struct.js.map