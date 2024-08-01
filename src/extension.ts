// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { generateKeyPair } from "crypto";
import { promisify } from "util";
import * as vscode from "vscode";
const generateKeyPairAsync = promisify(generateKeyPair);

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "generate-env-keypair.generate-env-keypair",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active text editor found");
        return;
      }

      const encoding = await vscode.window.showQuickPick(["base64", "plain"], {
        placeHolder: "Select encoding",
      });

      // generate keypair
      const { privateKey, publicKey } = await generateKeyPairAsync("rsa", {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
          cipher: "aes-256-cbc",
          passphrase: "top secret",
        },
      });

      const encoder = encoding === "base64" ? "base64" : "utf-8";
      const encodedEntries = Object.entries({
        PRIVATE_KEY: privateKey,
        PUBLIC_KEY: publicKey,
      }).map(([key, value]) => [key, Buffer.from(value).toString(encoder)]);

      // insert the keypair as PRIVATE_KEY="..." and PUBLIC_KEY="..." at the current cursor position
      editor.edit((editBuilder) => {
        editBuilder.insert(
          editor.selection.active,
          encodedEntries.map(([key, value]) => `${key}="${value}"\n`).join("")
        );
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
