// script.js
import * as anchor from '@project-serum/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from './inventory_management.json';
import fs from 'fs';

// Program ID của smart contract (thay đổi nếu cần)
const PROGRAM_ID = new PublicKey('DcQj92Cx3KybsG7WoVoDumf8foC8Zqycbg2rTNetVxba');

// Kết nối đến Solana network (sử dụng local validator)
const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

// Tạo Keypair từ file JSON (ví của bạn)
const walletKeyPair = Keypair.fromSecretKey(
    Uint8Array.from(
        JSON.parse(
            fs.readFileSync('/home/ducdatblockchain/.config/solana/id.json', 'utf-8')
        )
    )
);

// Khởi tạo provider và program
const provider = new anchor.AnchorProvider(connection, walletKeyPair, {});
const program = new anchor.Program(idl, PROGRAM_ID, provider);

// Biến lưu trữ productKeypair
let productKeypair = null;
let productPublicKey = null;

// Hàm tạo sản phẩm
const createProductBtn = document.getElementById("createProductBtn");
createProductBtn.addEventListener("click", createProduct);

async function createProduct() {
    const productId = document.getElementById("productId").value;
    const productName = document.getElementById("productName").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const dateAdded = new anchor.BN(Date.parse(document.getElementById("dateAdded").value) / 1000);

    // Tạo keypair mới cho sản phẩm
    productKeypair = Keypair.generate();
    productPublicKey = productKeypair.publicKey; // Lưu lại public key

    try {
        await program.rpc.createProduct(
            productId,
            productName,
            new anchor.BN(quantity),
            dateAdded,
            {
                accounts: {
                    product: productPublicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [productKeypair],
            }
        );
        document.getElementById("result").innerText = "Sản phẩm đã được tạo thành công!";
    } catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        document.getElementById("result").innerText = "Lỗi khi tạo sản phẩm: " + error.message; // Hiển thị thông báo lỗi chi tiết hơn
    }
}

// Hàm xử lý đơn hàng
const fulfillOrderBtn = document.getElementById("fulfillOrderBtn");
fulfillOrderBtn.addEventListener("click", fulfillOrder);

async function fulfillOrder() {
    const quantityOrdered = parseInt(document.getElementById("orderQuantity").value);

    // Kiểm tra xem sản phẩm đã được tạo chưa
    if (!productPublicKey) {
        alert("Chưa có sản phẩm nào được tạo.");
        return;
    }

    try {
        await program.rpc.fulfillOrder(
            new anchor.BN(quantityOrdered),
            {
                accounts: {
                    product: productPublicKey,
                },
            }
        );
        document.getElementById("result").innerText = "Đơn hàng đã được xử lý thành công!";
    } catch (error) {
        console.error("Lỗi khi xử lý đơn hàng:", error);
        document.getElementById("result").innerText = "Lỗi khi xử lý đơn hàng: " + error.message; // Hiển thị thông báo lỗi chi tiết hơn
    }
}
