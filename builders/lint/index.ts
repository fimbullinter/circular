import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import {
    CachedFileSystem,
    ConfigurationError,
    createCoreModule,
    createDefaultModule,
    DirectoryService,
    FormatterLoader,
    GlobalOptions,
    MessageHandler,
    ParsedGlobalOptions,
    parseGlobalOptions,
    Runner,
} from '@fimbul/wotan';
import { Container, ContainerModule, injectable } from 'inversify';
import resolve = require('resolve');
import {promises as fs} from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

async function lint(rawOptions: Partial<ParsedGlobalOptions>, context: BuilderContext): Promise<BuilderOutput> {
    if (!('project' in rawOptions) && context.target) {
        const project: string[] = [];
        for (const target of ['build', 'test']) {
            try {
                project.push((await context.getTargetOptions({project: context.target.project, target})).tsConfig as string);
            } catch {}
        }
        rawOptions = {project, ...rawOptions};
    }
    const globalOptionsPath = path.join(context.workspaceRoot, '.fimbullinter.yaml');
    try {
        rawOptions = {...yaml.load(await fs.readFile(globalOptionsPath, {encoding: 'utf-8'})) as object, ...rawOptions};
        context.logger.debug(`Using global options from ${globalOptionsPath}`);
    } catch (e) {
        context.logger.debug(`Not using global options from ${globalOptionsPath}: ${e?.message}`);
    }

    const options = parseGlobalOptions(rawOptions);
    const container = new Container();
    container.bind(LintCommandRunner).toSelf();
    @injectable()
    class Logger implements MessageHandler {
        warnings = new Set<string>();
        log(message: string) {
            context.logger.info(message);
        }
        warn(message: string) {
            if (!this.warnings.has(message)) {
                this.warnings.add(message);
                context.logger.warn(message);
            }
        }
        error(e: any) {
            context.logger.error(e?.message || String(e));
        }
    }
    container.bind(MessageHandler).to(Logger);
    container.bind(DirectoryService).toConstantValue({
        getCurrentDirectory() {
            return context.workspaceRoot;
        },
    });
    try {
        if (options.modules.length)
            container.load(...await Promise.all(options.modules.map((m) => loadModule(m, context.workspaceRoot, rawOptions))));
        container.load(createCoreModule(rawOptions), createDefaultModule());

        return {
            success: container.get(LintCommandRunner).run(options),
        };
    } catch (e) {
        return {
            success: false,
            error: e instanceof ConfigurationError ? e.message : e?.stack || e?.message || e,
        }
    }
}

async function loadModule(moduleName: string, from: string, options: GlobalOptions) {
    try {
        moduleName = await new Promise((res, rej) => resolve(
            moduleName,
            { basedir: from },
            (err, resolved) => err ? rej(err) : res(resolved!),
        ));
    } catch (e) {
        throw new ConfigurationError(e.message);
    }
    const m = <{createModule?(options: GlobalOptions): ContainerModule} | null | undefined>await import(moduleName);
    if (typeof m?.createModule !== 'function')
        throw new ConfigurationError(`Module '${moduleName}' does not export a function 'createModule'.`);
    return m.createModule(options);
}

@injectable()
class LintCommandRunner {
    constructor(
        private runner: Runner,
        private formatterLoader: FormatterLoader,
        private logger: MessageHandler,
        private fs: CachedFileSystem,
    ) {}
    public run(options: ParsedGlobalOptions) {
        const formatter = new (this.formatterLoader.loadFormatter(options.formatter ?? 'stylish'))();
        const result = this.runner.lintCollection(options);
        let success = true;
        if (formatter.prefix !== undefined)
            this.logger.log(formatter.prefix);
        for (const [file, summary] of result) {
            if (summary.findings.some((f) => f.severity === 'error'))
                success = false;
            const formatted = formatter.format(file, summary);
            if (formatted !== undefined)
                this.logger.log(formatted);
            if (options.fix && summary.fixes)
                this.fs.writeFile(file, summary.content);
        }
        if (formatter.flush !== undefined) {
            const formatted = formatter.flush();
            if (formatted !== undefined)
                this.logger.log(formatted);
        }
        return success;
    }
}

export default createBuilder(lint);
