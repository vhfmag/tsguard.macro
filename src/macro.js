const { createMacro, MacroError } = require("babel-plugin-macros");
const babylon = require("babylon");
const t = require("@babel/types");
const { addNamespace } = require("@babel/helper-module-imports");

module.exports = createMacro(typeGuardMacro);

// lacking: TSTupleType | TSOptionalType | TSRestType | TSConditionalType | TSInferType | TSParenthesizedType | TSTypeOperator | TSIndexedAccessType | TSMappedType | TSExpressionWithTypeArguments
// not sure on how to handle those: TSVoidKeyword | TSThisType | TSConstructorType | TSTypeReference | TSTypePredicate | TSTypeQuery |

/**
 *
 *
 * @param {import("@babel/types").TSType} type
 * @param {string} identifier
 * @param {string} tg
 * @returns {string}
 */
function typeToGuard(type, identifier, tg) {
  if (t.isTSNeverKeyword(type)) {
    return "false";
  } else if (t.isTSAnyKeyword(type) || t.isTSUnknownKeyword(type)) {
    return "true";
  } else if (t.isTSUndefinedKeyword(type)) {
    return `${identifier} === undefined`;
  } else if (t.isTSNullKeyword(type)) {
    return `${identifier} === null`;
  } else if (t.isTSFunctionType(type)) {
    return `${identifier} instanceof Function`;
  } else if (t.isTSSymbolKeyword(type)) {
    return `type ${identifier} === "symbol"`;
  } else if (t.isTSBooleanKeyword(type)) {
    return `${tg}.isBoolean(${identifier})`;
  } else if (t.isTSNumberKeyword(type)) {
    return `${tg}.isNumber(${identifier})`;
  } else if (t.isTSNumberKeyword(type)) {
    return `${tg}.isNumber(${identifier})`;
  } else if (t.isTSObjectKeyword(type)) {
    return `${tg}.isObjectLike(${identifier})`;
  } else if (t.isTSStringKeyword(type)) {
    return `${tg}.isString(${identifier})`;
  } else if (t.isTSLiteralType(type)) {
    return `${identifier} === ${JSON.stringify(type.literal.value)}`;
  } else if (t.isTSParenthesizedType(type)) {
    return typeToGuard(type.typeAnnotation, identifier, tg);
  } else if (t.isTSArrayType(type)) {
    return `Array.isArray(${identifier}) && ${identifier}.every(x => ${typeToGuard(
      type.elementType,
      "x",
      tg,
    )})`;
  } else if (t.isTSTypeLiteral(type)) {
    const propertyGuards = type.members.map(
      propType =>
        `.withProperty("${propType.key.name}", x => ${
          propType.optional ? "x === undefined ||" : ""
        } ${typeToGuard(propType.typeAnnotation.typeAnnotation, "x", tg)})`,
    );
    return `new ${tg}.IsInterface()${propertyGuards.join(
      "",
    )}.get()(${identifier})`;
  } else if (t.isTSIntersectionType(type)) {
    return type.types
      .map(nestedType => typeToGuard(nestedType, identifier, tg))
      .join(" & ");
  } else if (t.isTSUnionType(type)) {
    return type.types
      .map(nestedType => typeToGuard(nestedType, identifier, tg))
      .join(" | ");
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
  const path = references.default[0];
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
  console.dir(expectedType, { depth: 5 });
  const identifier = macroArgument.name;
  const generatedCode = typeToGuard(
    expectedType,
    identifier,
    generatedImport.name,
  );
  const generatedAst = babylon.parse(generatedCode);
  path.parentPath.replaceWith(generatedAst.program.body[0]);
}
