import { memo, type ReactNode } from 'react';

import { SupportedLanguage, supportedLanguages } from '@/lib/constant';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LanguageSelectProps = {
  language: SupportedLanguage;
  disabled: boolean;
  setLanguage: (value: SupportedLanguage) => void;
};

export const LanguageSelect = memo(
  ({
    language,
    setLanguage,
    disabled = false,
  }: LanguageSelectProps): ReactNode => {
    function changeDevice(value: SupportedLanguage) {
      setLanguage(value);
    }

    return (
      <Select disabled={disabled} value={language} onValueChange={changeDevice}>
        <SelectTrigger>
          <SelectValue placeholder="Select an input device" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {supportedLanguages.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  },
);
