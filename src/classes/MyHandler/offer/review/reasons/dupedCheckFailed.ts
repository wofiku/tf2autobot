import SKU from 'tf2-sku-2';
import pluralize from 'pluralize';
import Bot from '../../../../Bot';

import { UnknownDictionary } from '../../../../../types/common';

export default function dupedCheckFailed(meta: UnknownDictionary<any>, bot: Bot): { note: string; name: string[] } {
    const wrong = meta.reasons;
    const dupedFailedItemsName: string[] = [];
    const dupedFailed = wrong.filter(el => el.reason.includes('🟪_DUPE_CHECK_FAILED'));

    dupedFailed.forEach(el => {
        if (el.withError === false) {
            // If 🟪_DUPE_CHECK_FAILED occurred without error, then this sku/assetid is string.
            const name = bot.schema.getName(SKU.fromString(el.sku), false);

            if (bot.options.discordWebhook.offerReview.enable && bot.options.discordWebhook.offerReview.url) {
                // if Discord Webhook for review offer enabled, then make it link the item name to the backpack.tf item history page.
                dupedFailedItemsName.push(`${name} - [history page](https://backpack.tf/item/${el.assetid})`);
            } else {
                // else Discord Webhook for review offer disabled, make the link to backpack.tf item history page separate with name.
                dupedFailedItemsName.push(`${name}, history page: https://backpack.tf/item/${el.assetid}`);
            }
        } else {
            // Else if 🟪_DUPE_CHECK_FAILED occurred with error, then this sku/assetid is string[].
            for (let i = 0; i < el.sku.length; i++) {
                const name = bot.schema.getName(SKU.fromString(el.sku[i]), false);

                if (bot.options.discordWebhook.offerReview.enable && bot.options.discordWebhook.offerReview.url) {
                    // if Discord Webhook for review offer enabled, then make it link the item name to the backpack.tf item history page.
                    dupedFailedItemsName.push(`${name} - [history page](https://backpack.tf/item/${el.assetid})`);
                } else {
                    // else Discord Webhook for review offer disabled, make the link to backpack.tf item history page separate with name.
                    dupedFailedItemsName.push(`${name}, history page: https://backpack.tf/item/${el.assetid}`);
                }
            }
        }
    });

    const note = bot.options.manualReview.dupedCheckFailed.note
        ? `🟪_DUPE_CHECK_FAILED - ${bot.options.manualReview.dupedCheckFailed.note}`
              .replace(/%name%/g, dupedFailedItemsName.join(', '))
              .replace(/%isName%/, pluralize('is', dupedFailedItemsName.length))
        : `🟪_DUPE_CHECK_FAILED - I failed to check for duped on ${dupedFailedItemsName.join(', ')}.`;
    // Default note: I failed to check for duped on %name%.

    const name = dupedFailedItemsName;

    return { note, name };
}
