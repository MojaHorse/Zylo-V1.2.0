import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import type { InventoryItem } from '../../types';

export const generateInventoryReport = async (items: InventoryItem[], type: 'csv' | 'pdf', businessName: string = 'My Business') => {
    try {
        if (type === 'csv') {
            await generateCSV(items);
        } else {
            await generatePDF(items, businessName);
        }
    } catch (error) {
        console.error("Report Generation Error:", error);
        Alert.alert("Error", "Failed to generate report.");
    }
};

const generateCSV = async (items: InventoryItem[]) => {
    const header = "ID,Name,Category,Quantity,Unit,Cost Price,Total Value,Low Stock Threshold\n";
    const rows = items.map(item =>
        `${item.id},"${item.name}","${item.category || ''}",${item.quantity},"${item.unit}",${item.cost_price || 0},${(item.quantity * (item.cost_price || 0)).toFixed(2)},${item.low_stock_threshold}`
    ).join("\n");

    const csvContent = header + rows;
    // @ts-ignore
    const itemsPath = `${FileSystem.documentDirectory}inventory_report.csv`;

    // @ts-ignore
    await FileSystem.writeAsStringAsync(itemsPath, csvContent, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(itemsPath);
    } else {
        Alert.alert("Error", "Sharing is not available on this device");
    }
};

const generatePDF = async (items: InventoryItem[], businessName: string) => {
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0);
    const date = new Date().toLocaleDateString();

    const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
          .low-stock { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Inventory Report</h1>
        <div class="header">
          <div><strong>Business:</strong> ${businessName}</div>
          <div><strong>Date:</strong> ${date}</div>
        </div>

        <table>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Cost</th>
            <th>Total Value</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.category || '-'}</td>
              <td class="${item.quantity <= item.low_stock_threshold ? 'low-stock' : ''}">${item.quantity}</td>
              <td>${item.unit}</td>
              <td>R ${(item.cost_price || 0).toFixed(2)}</td>
              <td>R ${(item.quantity * (item.cost_price || 0)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <div class="total">
          Total Inventory Value: R ${totalValue.toFixed(2)}
        </div>
      </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
};
