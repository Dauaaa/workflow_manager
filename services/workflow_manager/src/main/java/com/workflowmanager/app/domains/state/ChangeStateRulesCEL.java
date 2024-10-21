package com.workflowmanager.app.domains.state;

import dev.cel.common.CelAbstractSyntaxTree;
import dev.cel.common.CelValidationException;
import dev.cel.common.types.SimpleType;
import dev.cel.compiler.CelCompiler;
import dev.cel.compiler.CelCompilerFactory;
import dev.cel.runtime.CelEvaluationException;
import dev.cel.runtime.CelRuntime;
import dev.cel.runtime.CelRuntimeFactory;

public class ChangeStateRulesCEL {
    // Construct the compilation and runtime environments.
  // These instances are immutable and thus trivially thread-safe and amenable to caching.
  private static final CelCompiler CEL_COMPILER =
      CelCompilerFactory.standardCelCompilerBuilder().addVar("my_var", SimpleType.STRING).build();
  private static final CelRuntime CEL_RUNTIME =
      CelRuntimeFactory.standardCelRuntimeBuilder().build();
}
