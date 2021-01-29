import pluralize from 'pluralize';
import SKU from 'tf2-sku-2';
import Cart from './Cart';
import log from '../../lib/logger';

export default class PremiumCart extends Cart {
    protected preSendOffer(): Promise<void> {
        return Promise.resolve();
    }

    constructOffer(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.isEmpty) {
                return reject('cart is empty');
            }

            const offer = this.bot.manager.createOffer(
                'https://steamcommunity.com/tradeoffer/new/?partner=240216030&token=duh3W4zi' // Backpack.tf premium purchase bot
                // https://steamcommunity.com/id/backpacktf001
            );

            const alteredMessages: string[] = [];

            // Add our items
            const ourInventory = this.bot.inventoryManager.getInventory;

            for (const sku in this.our) {
                if (!Object.prototype.hasOwnProperty.call(this.our, sku)) {
                    continue;
                }

                let amount = this.getOurCount(sku);
                const ourAssetids = ourInventory.findBySKU(sku, true);

                if (amount > ourAssetids.length) {
                    amount = ourAssetids.length;
                    // Remove the item from the cart
                    this.removeOurItem(sku);

                    if (ourAssetids.length === 0) {
                        alteredMessages.push(
                            "I don't have any " + pluralize(this.bot.schema.getName(SKU.fromString(sku), false))
                        );
                    } else {
                        alteredMessages.push(
                            'I only have ' +
                                pluralize(this.bot.schema.getName(SKU.fromString(sku), false), ourAssetids.length, true)
                        );

                        // Add the max amount to the offer and substract current added amount
                        this.addOurItem(sku, ourAssetids.length - this.our[sku]);
                    }
                }

                let missing = amount;
                let isSkipped = false;

                for (let i = 0; i < ourAssetids.length; i++) {
                    if (
                        this.bot.options.miscSettings.skipItemsInTrade.enable &&
                        this.bot.trades.isInTrade(ourAssetids[i])
                    ) {
                        isSkipped = true;
                        continue;
                    }
                    const isAdded = offer.addMyItem({
                        appid: 440,
                        contextid: '2',
                        assetid: ourAssetids[i]
                    });

                    if (isAdded) {
                        // The item was added to the offer
                        missing--;
                        if (missing === 0) {
                            // We added all the items
                            break;
                        }
                    }
                }

                if (missing !== 0) {
                    log.warn(
                        `Failed to create offer because missing our items${
                            isSkipped ? '. Reason: Item(s) are currently being used in another active trade' : ''
                        }`,
                        {
                            sku: sku,
                            required: amount,
                            missing: missing
                        }
                    );

                    return reject(
                        `Something went wrong while constructing the offer${
                            isSkipped ? '. Reason: Item(s) are currently being used in another active trade.' : ''
                        }`
                    );
                }
            }

            if (Object.keys(this.their).length === 0) {
                // Done constructing offer

                offer.data('dict', { our: this.our, their: this.their });
                offer.data('buyBptfPremium', true);

                this.offer = offer;

                return resolve(alteredMessages.length === 0 ? undefined : alteredMessages.join(', '));
            }
        });
    }
}
