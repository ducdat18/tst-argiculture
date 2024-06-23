import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { assert } from 'chai';
import { InventoryManagement } from '../target/types/inventory_management';
import { Connection, Keypair } from '@solana/web3.js';
import fs from 'fs';


describe('tstkho2', () => {
  // Cấu hình provider và program
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed'); // Thay đổi nếu cần

    // 2. Tạo Keypair từ file JSON
    const walletKeyPair = Keypair.fromSecretKey(
        Uint8Array.from(
            JSON.parse(
                fs.readFileSync('/home/ducdatblockchain/.config/solana/id.json', 'utf-8')
            )
        )
    );

    // 3. Khởi tạo provider
    const provider = new anchor.AnchorProvider(connection, walletKeyPair, {});

    // 4. Lấy program
    const program = anchor.workspace.InventoryManagement as Program<InventoryManagement>;

    // Tạo keypair cho tài khoản sản phẩm
    const productKeypair = Keypair.generate();

  it('Tạo và xử lý đơn hàng cho một sản phẩm', async () => {
    // 1. Tạo sản phẩm
    const productId = "P001";
    const productName = "Sản phẩm A";
    const initialQuantity = 100;
    const dateAdded = new anchor.BN(Math.floor(Date.now() / 1000));  // Timestamp hiện tại

    await program.rpc.createProduct(
      productId,
      productName,
      new anchor.BN(initialQuantity),
      dateAdded,
      {
        accounts: {
          product: productKeypair.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [productKeypair],
      }
    );

    // 2. Kiểm tra thông tin sản phẩm sau khi tạo
    let productAccount = await program.account.product.fetch(productKeypair.publicKey);
    assert.equal(productAccount.productId, productId);
    assert.equal(productAccount.productName, productName);
    assert.equal(productAccount.quantity.toNumber(), initialQuantity);
    assert.equal(productAccount.dateAdded.toNumber(), dateAdded.toNumber());

    // 3. Xử lý đơn hàng (đủ hàng)
    const quantityOrdered = 50;
    await program.rpc.fulfillOrder(
      new anchor.BN(quantityOrdered),
      {
        accounts: {
          product: productKeypair.publicKey,
        },
      }
    );

    // 4. Kiểm tra số lượng sản phẩm sau khi xử lý đơn hàng
    productAccount = await program.account.product.fetch(productKeypair.publicKey);
    assert.equal(productAccount.quantity.toNumber(), initialQuantity - quantityOrdered);

    // 5. Xử lý đơn hàng (không đủ hàng) - Test case này sẽ throw lỗi
    const insufficientQuantityOrdered = 60;
    try {
      await program.rpc.fulfillOrder(
        new anchor.BN(insufficientQuantityOrdered),
        {
          accounts: {
            product: productKeypair.publicKey,
          },
        }
      );
      assert.fail('The instruction should have failed with insufficient stock error.');
    } catch (err) {
      assert.include(err.toString(), 'InsufficientStock');
    }
  });
});
