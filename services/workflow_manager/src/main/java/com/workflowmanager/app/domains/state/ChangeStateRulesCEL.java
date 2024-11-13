package com.workflowmanager.app.domains.state;

import com.workflowmanager.app.core.ErrorUtils;
import com.workflowmanager.app.domains.WorkflowAttribute;
import com.workflowmanager.app.domains.WorkflowAttributeDescription;
import com.workflowmanager.app.domains.WorkflowAttributeDescription.WorkflowAttributeType;
import dev.cel.common.CelAbstractSyntaxTree;
import dev.cel.common.CelValidationException;
import dev.cel.common.types.CelTypes;
import dev.cel.common.types.SimpleType;
import dev.cel.compiler.CelCompiler;
import dev.cel.compiler.CelCompilerBuilder;
import dev.cel.compiler.CelCompilerFactory;
import dev.cel.expr.Type;
import dev.cel.runtime.CelEvaluationException;
import dev.cel.runtime.CelRuntime;
import dev.cel.runtime.CelRuntimeFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.server.ResponseStatusException;

public class ChangeStateRulesCEL {
  private static final CelRuntime CEL_RUNTIME =
      CelRuntimeFactory.standardCelRuntimeBuilder().build();

  public static void checkRules(
      List<WorkflowAttributeDescription> descriptions, ChangeStateRules rules)
      throws ResponseStatusException {
    CelCompiler compiler = getCompiler(descriptions);
    List<String> errors = new ArrayList<>();

    CelAbstractSyntaxTree ast;

    for (int i = 0; i < rules.getExpressions().size(); i++) {
      String expression = rules.getExpressions().get(i);

      try {
        ast = compiler.parse(expression).getAst();
        compiler.check(ast);
      } catch (CelValidationException e) {
        errors.addLast(String.format("%s: %s", rules.getExpressionNames().get(i), e.getMessage()));
      }
    }

    ErrorUtils.assertEq(
        errors.size(),
        0,
        "Some rules are not valid:\n" + errors.stream().collect(Collectors.joining("\n    ")));

    return;
  }

  public static void applyRule(
      List<WorkflowAttributeDescription> descriptions,
      ChangeStateRules rules,
      List<WorkflowAttribute> workflowAttrs,
      List<WorkflowAttribute> entityAttrs,
      List<WorkflowAttribute> fromStateAttrs,
      List<WorkflowAttribute> toStateAttrs)
      throws ResponseStatusException {
    CelCompiler compiler = getCompiler(descriptions);
    List<String> errors = new ArrayList<>();
    CelAbstractSyntaxTree ast;

    Map<String, Object> values = new HashMap<>();
    Map<String, WorkflowAttributeType> description_name_to_type =
        descriptions.stream()
            .collect(Collectors.toMap(WorkflowAttributeDescription::getName, x -> x.getAttrType()));

    for (WorkflowAttribute attr : workflowAttrs) {
      WorkflowAttributeType ty = description_name_to_type.get(attr.getDescriptionName());

      values.put("w_" + attr.getDescriptionName(), attr.getValue(ty));
    }

    for (WorkflowAttribute attr : entityAttrs) {
      WorkflowAttributeType ty = description_name_to_type.get(attr.getDescriptionName());

      values.put("e_" + attr.getDescriptionName(), attr.getValue(ty));
    }

    for (WorkflowAttribute attr : fromStateAttrs) {
      WorkflowAttributeType ty = description_name_to_type.get(attr.getDescriptionName());

      values.put("fs_" + attr.getDescriptionName(), attr.getValue(ty));
    }

    for (WorkflowAttribute attr : toStateAttrs) {
      WorkflowAttributeType ty = description_name_to_type.get(attr.getDescriptionName());

      values.put("ts_" + attr.getDescriptionName(), attr.getValue(ty));
    }

    for (int i = 0; i < rules.getExpressions().size(); i++) {
      String expression = rules.getExpressions().get(i);

      try {
        ast = compiler.parse(expression).getAst();
        ast = compiler.check(ast).getAst();
      } catch (CelValidationException e) {
        errors.addLast(String.format("%s: %s", rules.getExpressionNames().get(i), e.getMessage()));
        continue;
      }

      try {
        CelRuntime.Program program = CEL_RUNTIME.createProgram(ast);
        if (!(Boolean) program.eval(values))
          errors.addLast(String.format("%s: returned false", rules.getExpressionNames().get(i)));
      } catch (CelEvaluationException e) {
        errors.addLast(String.format("%s: %s", rules.getExpressionNames().get(i), e.getMessage()));
      }
    }

    ErrorUtils.assertEq(
        errors.size(),
        0,
        "Some failed to compile, failed to execute or returned false:\n"
            + errors.stream().collect(Collectors.joining("\n    ")));

    return;
  }

  private static CelCompiler getCompiler(List<WorkflowAttributeDescription> descriptions) {
    CelCompilerBuilder compBuilder = CelCompilerFactory.standardCelCompilerBuilder();

    for (WorkflowAttributeDescription description : descriptions) {
      switch (description.getRefType()) {
        case WORKFLOW:
          compBuilder.addVar("w_" + description.getName(), getType(description));
          break;
        case WORKFLOW_ENTITY:
          compBuilder.addVar("e_" + description.getName(), getType(description));
          break;
        case WORKFLOW_STATE:
          compBuilder.addVar("fs_" + description.getName(), getType(description));
          compBuilder.addVar("ts_" + description.getName(), getType(description));
          break;
      }
    }

    return compBuilder.setResultType(SimpleType.BOOL).build();
  }

  private static Type getType(WorkflowAttributeDescription description) {
    switch (description.getAttrType()) {
      case DATE:
      case TIMESTAMP:
        return CelTypes.TIMESTAMP;
      case INTEGER:
        return CelTypes.INT64;
      case TEXT:
      case ENUMERATION:
      case DECIMAL:
        return CelTypes.STRING;
      case FLAG:
        return CelTypes.BOOL;
      case FLOATING:
        return CelTypes.DOUBLE;
    }

    // unreachable
    return null;
  }
}
