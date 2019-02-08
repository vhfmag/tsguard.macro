// @ts-ignore
const { createMacro, MacroError } = require("babel-plugin-macros");
const parser = require("@babel/parser");
const t = require("@babel/types");
const { addNamespace } = require("@babel/helper-module-imports");

module.exports = createMacro(typeGuardMacro);

// lacking: TSTupleType | TSOptionalType | TSRestType | TSConditionalType | TSInferType | TSTypeOperator | TSIndexedAccessType | TSMappedType | TSExpressionWithTypeArguments
// not sure on how to handle those: TSVoidKeyword | TSThisType | TSConstructorType | TSTypeReference | TSTypePredicate | TSTypeQuery |

/**
 *
 *
 * @param {import("@babel/types").TSType} type
 * @param {string} tg
 * @returns {string}
 */
function typeToPartialGuard(type, tg) {
  if (t.isTSNeverKeyword(type)) {
    return "(() => false)";
  } else if (t.isTSAnyKeyword(type) || t.isTSUnknownKeyword(type)) {
    return "(() => true)";
  } else if (t.isTSUndefinedKeyword(type)) {
    return `${tg}.isUndefined`;
  } else if (t.isTSNullKeyword(type)) {
    return `${tg}.isNull`;
  } else if (t.isTSFunctionType(type)) {
    return `(v => v instanceof Function)`;
  } else if (t.isTSSymbolKeyword(type)) {
    return `(v => type v === "symbol")`;
  } else if (t.isTSBooleanKeyword(type)) {
    return `${tg}.isBoolean`;
  } else if (t.isTSNumberKeyword(type)) {
    return `${tg}.isNumber`;
  } else if (t.isTSNumberKeyword(type)) {
    return `${tg}.isNumber`;
  } else if (t.isTSObjectKeyword(type)) {
    return `${tg}.isObject`;
  } else if (t.isTSStringKeyword(type)) {
    return `${tg}.isString`;
  } else if (t.isTSLiteralType(type)) {
    return `(v => v === ${JSON.stringify(type.literal.value)})`;
  } else if (t.isTSParenthesizedType(type)) {
    return typeToPartialGuard(type.typeAnnotation, tg);
  } else if (t.isTSArrayType(type)) {
    return `${tg}.isArray(${typeToPartialGuard(type.elementType, tg)})`;
  } else if (t.isTSTypeLiteral(type)) {
    const propertyGuards = type.members.map(propType => {
      if (t.isTSPropertySignature(propType)) {
        if (t.isIdentifier(propType.key)) {
          const partialTypeGuard = typeToPartialGuard(
            propType.typeAnnotation.typeAnnotation,
            tg,
          );

          return `.withProperty("${propType.key.name}", ${
            propType.optional
              ? `${tg}.isOptional(${partialTypeGuard})`
              : partialTypeGuard
          })`;
        } else if (t.isBinaryExpression(propType.key)) {
          // { [key in T] }
          throw Error("Unimplemented");
        }

        throw Error("Unimplemented");
      } else if (t.isTSIndexSignature(propType)) {
        // { [key: string] }
        throw Error("Unimplemented");
      }

      // ???
      throw Error("Unimplemented");
    });
    return `(new ${tg}.IsInterface()${propertyGuards.join("")}.get())`;
  } else if (t.isTSIntersectionType(type)) {
    return `${tg}.isIntersection(${type.types
      .map(nestedType => typeToPartialGuard(nestedType, tg))
      .join(", ")})`;
  } else if (t.isTSUnionType(type)) {
    return `${tg}.isUnion(${type.types
      .map(nestedType => typeToPartialGuard(nestedType, tg))
      .join(", ")})`;
  }

  throw new Error("Unimplemented");
}

/**
 *
 * @typedef MacroArgument
 * @type {Object}
 * @prop {import("@babel/core")} babel
 * @prop {{ [key: string]: Array<any> | undefined }} references
 * @prop {any} state
 * @prop {string} source
 */

/**
 *
 *
 * @param {MacroArgument} arg
 */
function typeGuardMacro({ references, state, babel: { types }, source }) {
  for (const path of references.default) {
    const callExpression = path.parent;

    if (
      !t.isCallExpression(callExpression) ||
      callExpression.typeParameters.params.length !== 1
    ) {
      throw new MacroError(
        "Macro should be called as a function and passed exactly one type parameter",
      );
    }

    const macroArgument = callExpression.arguments[0];

    if (!t.isIdentifier(macroArgument)) {
      throw new MacroError(
        "For now, this macro works with identifiers only, sorry",
      );
    }

    const generatedImport = addNamespace(path, "generic-type-guard");

    if (!t.isIdentifier(generatedImport)) {
      throw new MacroError("Something wrong happened at our side, sorry");
    }

    const expectedType = callExpression.typeParameters.params[0];
    const identifier = macroArgument.name;
    const generatedCode = `(${typeToPartialGuard(
      expectedType,
      generatedImport.name,
    )})(${identifier})`;
    const generatedAst = parser.parse(generatedCode);
    path.parentPath.replaceWith(generatedAst.program.body[0]);
  }
}
