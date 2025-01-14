import { ethers } from 'ethers';
import { FC, useCallback, useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/elements';
import { FixedPointMath } from '@/sdk';
import { numberToString, safeToBigNumber } from '@/utils';

import {
  calculateDineroLeftToBorrow,
  safeAmountToWithdrawRepay,
} from '../../dinero-market.utils';
import { InputMaxButtonProps } from './input-money.types';

const InputMaxButton: FC<InputMaxButtonProps> = ({
  max,
  name,
  data,
  control,
  setValue,
}) => {
  const borrowCollateral = useWatch({ control, name: 'borrow.collateral' });
  const borrowLoan = useWatch({ control, name: 'borrow.loan' });
  const repayLoan = useWatch({ control, name: 'repay.loan' });
  const repayCollateral = useWatch({ control, name: 'repay.collateral' });

  const maxBorrowLoan = numberToString(
    calculateDineroLeftToBorrow({
      ...data,
      adjustedUserCollateral: data.adjustedUserCollateral.add(
        safeToBigNumber(+borrowCollateral || 0)
      ),
    })
      .mul(ethers.utils.parseEther('0.9'))
      .toNumber()
  );

  const maxRepayCollateral = numberToString(
    safeAmountToWithdrawRepay(data, safeToBigNumber(+repayLoan)).toNumber()
  );

  useEffect(() => {
    if (+borrowLoan > +maxBorrowLoan) setValue('borrow.loan', maxBorrowLoan);
  }, [borrowLoan]);

  useEffect(() => {
    if (+repayCollateral > +maxRepayCollateral)
      setValue('repay.collateral', maxRepayCollateral);
  }, [repayCollateral]);

  useEffect(() => {
    if (FixedPointMath.toBigNumber(repayLoan).gt(data.dnrBalance))
      setValue(
        'repay.loan',
        numberToString(FixedPointMath.from(data.dnrBalance).toNumber())
      );

    if (
      FixedPointMath.toBigNumber(borrowCollateral).gt(
        data.adjustedCollateralBalance
      )
    )
      setValue(
        'borrow.collateral',
        numberToString(
          FixedPointMath.from(data.adjustedCollateralBalance).toNumber()
        )
      );
  }, [repayLoan, borrowCollateral]);

  const handleSetInnerMax = useCallback(() => {
    if (name === 'borrow.loan') {
      setValue(name, maxBorrowLoan);
      return;
    }

    if (name === 'repay.collateral') {
      setValue(name, maxRepayCollateral);
      return;
    }

    setValue(name, max ? numberToString(max) : '0');
  }, [repayLoan, borrowCollateral, data]);

  const isDisabled = useMemo(() => {
    if (name === 'repay.collateral') return data.userCollateral.isZero();

    if (name === 'repay.loan')
      return data.loanElastic.isZero() || data.dnrBalance.isZero();

    if (name === 'borrow.collateral') return data.collateralBalance.isZero();

    return false;
  }, [
    data.userCollateral.toString(),
    data.loanElastic.toString(),
    data.dnrBalance.toString(),
    data.collateralBalance.toString(),
    name,
  ]);

  return (
    <Button
      px="M"
      fontSize="S"
      type="button"
      height="100%"
      variant="secondary"
      disabled={isDisabled}
      hover={{ bg: 'accent' }}
      onClick={handleSetInnerMax}
      active={{ bg: 'accentActive' }}
      bg={isDisabled ? 'disabled' : 'bottomBackground'}
    >
      max
    </Button>
  );
};

export default InputMaxButton;
