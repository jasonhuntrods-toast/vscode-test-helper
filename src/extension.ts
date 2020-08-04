import * as vscode from 'vscode';
const path = require('path');

export function activate(context: vscode.ExtensionContext) {

  /*
  extension settings format example (ruby on rails)
  "testhelper.mappings": {
    "my-project-folder": {
      "testCommand": "bundle exec rake TEST={testPath}",
      "testModifier": "_test",
      "mappings": {
        "app/controllers": "test/controllers"
      }
    }
  }
  */

  const openCommandHandler = (currentFileUri: vscode.Uri) => {
    const fullMappedPath = getTestPathFromCurrentFile(currentFileUri);
    if (fullMappedPath) {
      vscode.workspace.openTextDocument(fullMappedPath).then(document => vscode.window.showTextDocument(document));
    }
  };

  const runCommandHandler = (currentFileUri: vscode.Uri) => {
    const currentFilePath = currentFileUri.path;
    const projectFolder = getProjectFolder(currentFilePath);
    if (projectFolder) {
      const projectMappings = getProjectMapping(currentFilePath, projectFolder);
      const fullMappedPath = getTestPathFromCurrentFile(currentFileUri);
      if (fullMappedPath) {
        const terminal = vscode.window.createTerminal('TestHelper');
        terminal.show(true);
        const testCommand = projectMappings.testCommand.replace('{testPath}', fullMappedPath);
        terminal.sendText(testCommand);
      }
    }
  };

  const getTestPathFromCurrentFile = (currentFileUri: vscode.Uri) => {
    const currentFilePath = currentFileUri.path;
    const projectFolder = getProjectFolder(currentFilePath);
    if (projectFolder) {
      const projectMappings = getProjectMapping(currentFilePath, projectFolder);
      if (projectMappings) {
        const mappedPath = Object.keys(projectMappings.mappings).find(map => currentFilePath.includes(map));
        if (mappedPath) {
          const fileName = path.parse(currentFilePath).name;
          const fileExtension = path.parse(currentFilePath).ext;
          const mappedFile = `${fileName}${projectMappings.testModifier}${fileExtension}`;
          const rootPath = currentFilePath.split(projectFolder)[0];
          const mapGapPath = currentFilePath.split(mappedPath)[1].split(`${fileName}${fileExtension}`)[0];
          const testMap = projectMappings.mappings[mappedPath];
          return `${rootPath}${projectFolder}/${testMap}${mapGapPath}${mappedFile}`;
        }
      }
    }
  };

  const getProjectFolder = (currentFilePath: string) => {
    const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.name);
    return workspaceFolders?.find(folder => currentFilePath.includes(`/code/${folder}/`));
  };

  const getProjectMapping = (currentFilePath: string, projectFolder: string) => {
    if (currentFilePath && projectFolder) {
      const workspaceMappings = vscode.workspace.getConfiguration('testhelper.mappings');
      return workspaceMappings[projectFolder];
    }
  };

  context.subscriptions.push(vscode.commands.registerCommand('testhelper.open', openCommandHandler));
  context.subscriptions.push(vscode.commands.registerCommand('testhelper.run', runCommandHandler));

}
