export interface OrderNumberGenerator {
  generate(now: Date): Promise<string>;
}
