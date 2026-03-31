import * as vscode from "vscode";
import { FoodInventoryProvider, FoodItem, loadInventory, saveInventory } from "./inventory";

export function activate(context: vscode.ExtensionContext) {
  const inventoryFile = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders?.[0].uri ?? context.globalStorageUri,
    ".food-inventory.json",
  );

  const items = loadInventory(inventoryFile);
  const treeDataProvider = new FoodInventoryProvider(items, inventoryFile);

  const treeView = vscode.window.createTreeView("foodInventory.itemsView", {
    treeDataProvider,
  });

  context.subscriptions.push(treeView);

  const addItemCommand = vscode.commands.registerCommand("foodInventory.addItem", async () => {
    const name = await vscode.window.showInputBox({
      title: "Food name",
      placeHolder: "e.g. Chicken breast",
    });
    if (!name) {
      return;
    }

    const store = await vscode.window.showInputBox({
      title: "Store",
      placeHolder: "e.g. Aldi",
    });
    if (store === undefined) {
      return;
    }

    const priceInput = await vscode.window.showInputBox({
      title: "Total price",
      placeHolder: "e.g. 5.99",
      validateInput: (value) => (value && !isNaN(Number(value)) ? undefined : "Enter a number"),
    });
    if (!priceInput) {
      return;
    }

    const weightInput = await vscode.window.showInputBox({
      title: "Total weight (in grams)",
      placeHolder: "e.g. 1000",
      validateInput: (value) => (value && !isNaN(Number(value)) ? undefined : "Enter a number"),
    });
    if (!weightInput) {
      return;
    }

    const expiryInput = await vscode.window.showInputBox({
      title: "Expiry date (optional)",
      placeHolder: "YYYY-MM-DD",
    });

    const now = new Date();
    const item: FoodItem = {
      id: `${now.getTime()}`,
      name,
      store: store ?? "",
      price: Number(priceInput),
      weight: Number(weightInput),
      expiryDate: expiryInput ?? "",
      createdAt: now.toISOString(),
    };

    treeDataProvider.addItem(item);
    await saveInventory(inventoryFile, treeDataProvider.items);
  });

  const listItemsCommand = vscode.commands.registerCommand("foodInventory.listItems", () => {
    if (!treeDataProvider.items.length) {
      vscode.window.showInformationMessage("No food items in inventory yet.");
      return;
    }

    const picks = treeDataProvider.items.map((item) => {
      const pricePer100g = (item.price / item.weight) * 100;
      const weightPerCurrency = item.weight / item.price;
      return {
        label: `${item.name} (${item.store || "Unknown store"})`,
        description: `€${item.price.toFixed(2)} / ${item.weight}g`,
        detail: `Price per 100g: €${pricePer100g.toFixed(2)} | Weight per €1: ${weightPerCurrency.toFixed(
          0,
        )}g${item.expiryDate ? ` | Expiry: ${item.expiryDate}` : ""}`,
      };
    });

    vscode.window.showQuickPick(picks, {
      title: "Food Inventory",
      placeHolder: "Items with price per weight and expiry",
    });
  });

  context.subscriptions.push(addItemCommand, listItemsCommand);
}

export function deactivate() {
  // nothing to clean up
}

