import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { ParsedGlobalOptions } from '@fimbul/wotan';

function lint(_options: Partial<ParsedGlobalOptions>, _context: BuilderContext): BuilderOutput {
    return {
        success: true,
    };
}

export default createBuilder(lint);
