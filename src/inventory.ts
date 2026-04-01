import * as vscode from 'vscode';
import * as fs from 'fs';

export interface FoodItemeedafsd {
  id: string;
  name: string;
  store: string;
  price: number;
  weight: number;
  expiryDate: string;
  createdAt: string;
}

export function loadInventory(file: vscode.Uri): FoodItem[] {
  try {
    if (fs.existsSync(file.fsPath)) {
      const raw = fs.readFileSync(file.fsPath, 'utf8');
      const parsed = JSON.parse(raw) as FoodItem[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Failed to load food inventory', err);
  }
  return [];
}

export async function saveInventory(file: vscode.Uri, items: FoodItem[]): Promise<void> {
  try {
    const dir = vscode.Uri.joinPath(file, '..').fsPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(file.fsPath, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save food inventory', err);
    void vscode.window.showErrorMessage('Failed to save food inventory file.');
  }
}

export class FoodInventoryProvider implements vscode.TreeDataProvider<FoodItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  constructor(
    public items: FoodItem[],
    private readonly storageFile: vscode.Uri,
  ) {}

  getTreeItem(element: FoodItem): vscode.TreeItem {
    const pricePer100g = (element.price / element.weight) * 100;
    const weightPerCurrency = element.weight / element.price;

    const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
    item.description = `${element.store || 'Unknown'} • €${element.price.toFixed(2)} / ${element.weight}g`;
    item.tooltip = new vscode.MarkdownString(
      [
        `**Store**: ${element.store || 'Unknown'}`,
        `**Price**: €${element.price.toFixed(2)}`,
        `**Weight**: ${element.weight} g`,
        `**Price / 100g**: €${pricePer100g.toFixed(2)}`,
        `**Weight / €1**: ${weightPerCurrency.toFixed(0)} g`,
        element.expiryDate ? `**Expiry**: ${element.expiryDate}` : '',
      ]
        .filter(Boolean)
        .join('  \n'),
    );

    return item;
  }

  getChildren(): vscode.ProviderResult<FoodItem[]> {
    return this.items;
  }

  getParent(): vscode.ProviderResult<FoodItem> {
    return null;
  }

  addItem(item: FoodItem): void {
    this.items = [...this.items, item];
    this._onDidChangeTreeData.fire();
  }
}
