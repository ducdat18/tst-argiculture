use anchor_lang::prelude::*;

declare_id!("DcQj92Cx3KybsG7WoVoDumf8foC8Zqycbg2rTNetVxba"); // Thay bằng Program ID của bạn

#[program]
pub mod inventory_management {
    use super::*;

    pub fn create_product(
        ctx: Context<CreateProduct>,
        product_id: String,
        product_name: String,
        quantity: u64,
        date_added: i64,
    ) -> Result<()> {
        let product = &mut ctx.accounts.product;
        product.product_id = product_id;
        product.product_name = product_name;
        product.quantity = quantity;
        product.date_added = date_added;
        Ok(())
    }

    pub fn fulfill_order(ctx: Context<FulfillOrder>, quantity_ordered: u64) -> Result<()> {
        let product = &mut ctx.accounts.product;

        require!(
            product.quantity >= quantity_ordered,
            InventoryError::InsufficientStock
        );

        product.quantity -= quantity_ordered;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProduct<'info> {
    #[account(init, payer = user, space = 8 + 32 + 128 + 8 + 8)]
    pub product: Account<'info, Product>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FulfillOrder<'info> {
    #[account(mut)]
    pub product: Account<'info, Product>,
}

#[account]
#[derive(Default)]
pub struct Product {
    pub product_id: String,
    pub product_name: String,
    pub quantity: u64,
    pub date_added: i64,
}

#[error_code]
pub enum InventoryError {
    #[msg("Không đủ hàng tồn kho")]
    InsufficientStock,
}
